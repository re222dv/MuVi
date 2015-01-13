let Rx = require('rx');
import {getUser, getPlaylists, getPlaylist} from '../model/DAL/spotify.js';
import {getMissingFreebaseEntities} from './freebase.js';
import {getMissingVideos} from './youtube.js';
import neo4j from '../model/DAL/neo4j.js';
import {relate} from '../helpers.js';
let redis = require('../model/DAL/redis');

//const ONE_HOUR = 1000 * 60 * 60;
const ONE_HOUR = 1000 * 10;

/**
 * Updates the update time to current time
 * @param {SpotifyEntity} spotifyEntity
 */
let touch = (spotifyEntity) => {
  spotifyEntity.updated = Date.now();
  neo4j.save([spotifyEntity]);
};

/**
 * Get all the users playlists
 */
let getUserPlaylists = (userId, token, spotifyProfile, modifiedSince) =>
  getPlaylists(token, spotifyProfile.spotifyEntity.spotifyId, modifiedSince)
    .doOnCompleted(() => console.log('getPlaylists'))
    .flatMap(playlist => {
      return getPlaylist(token, playlist.tracks, modifiedSince)
        .doOnError(console.log)
        .doOnCompleted(() => console.log('getPlaylist'))
        .flatMap(playlistData => {
          let data = {
            entities: [
              spotifyProfile.user,
              spotifyProfile.spotifyEntity,
              playlist.playlist,
              playlist.spotifyEntity
            ],
            relations: [
              relate(spotifyProfile.user, 'is', spotifyProfile.spotifyEntity),
              relate(spotifyProfile.user, 'owns', playlist.playlist),
              relate(playlist.playlist, 'is', playlist.spotifyEntity),
            ],
          };

          data.entities = data.entities.concat(playlistData.entities);
          data.relations = data.relations
            .concat(playlistData.relations)
            .concat(playlistData.entities
              .filter(entity => entity.type === 'Song')
              .map(relate(playlist.playlist, 'contains'))
          );
          return neo4j.create(data.entities, data.relations)
            .then(getMissingFreebaseEntities)
            .then(() => redis.pub(`updated-${userId}`, 'part'))
            .then(getMissingVideos)
            .then(() => redis.pub(`updated-${userId}`, 'part'))
            .catch(e => {
              console.error(e);
              redis.pub(`updated-${userId}`, 'error')
            });
        });
    })
    .doOnCompleted(() => console.log('Spotify done'))
    .finally(() => {
      redis.del(`updating-${userId}`);
      redis.pub(`updated-${userId}`, 'completed');
    })
    .subscribeOnError((e) => {
      console.error('Playlist error', e);
      redis.del(`updating-${userId}`);
      redis.pub(`updated-${userId}`, 'error');
      redis.pub(`updated-${userId}`, 'completed');
    });

/**
 * Gets a users profile and updates her playlists if needed
 * @param {Token} user.token
 * @param {Session} user.session
 */
module.exports = (user) =>
  new Promise((resolve, reject) => {
    getUser(user.token)
      .subscribe(spotifyProfile => {
        neo4j.query('Match (spotify:SpotifyEntity {spotifyId : {spotifyId}})<--(user:User)' +
                    'Return user, spotify',
          {spotifyId: spotifyProfile.spotifyEntity.spotifyId}
        )
          .then(existingUsers => (existingUsers[0] || {}))
          .then(existingUser => {
            let modifiedSince;

            if (existingUser && existingUser.user) {
              user.session.data.userId = existingUser.user.id;
              modifiedSince = existingUser.spotify.updated;
              console.log('User exists');
              if (Date.now() - (modifiedSince || 0) < ONE_HOUR) {
                console.log(Date.now() - (modifiedSince || 0));
                return user.session.save().then(resolve);
              } else {
                redis.set(`updating-${existingUser.user.id}`, true)
                  .then(() => user.session.save())
                  .then(resolve)
                  .then(() => getUserPlaylists(
                    existingUser.user.id,
                    user.token,
                    spotifyProfile,
                    modifiedSince
                  ));
                console.log('Updating user details');
                touch(existingUser.spotify);
              }
            } else {
              neo4j.create(
                [spotifyProfile.user, spotifyProfile.spotifyEntity],
                [relate(spotifyProfile.user, 'is', spotifyProfile.spotifyEntity)]
              )
                .then(() => neo4j.query(
                  'Match (:SpotifyEntity {spotifyId : {spotifyId}})<--(user:User) Return user.id',
                  {spotifyId: spotifyProfile.spotifyEntity.spotifyId}
                ))
                .then((result) => {
                  if (!result[0]) {
                    reject();
                  }
                  user.session.data.userId = result[0]['user.id'];
                  return user.session.save();
                })
                .then(() => redis.set(`updating-${user.session.data.userId}`, true))
                .then(resolve)
                .then(() => getUserPlaylists(user.session.data.userId, user.token, spotifyProfile));
            }
          })
          .catch(reject);
      }, reject);
  });
