let autoCurry = require('auto-curry');
let Rx = require('rx');
import {getArtist} from '../model/DAL/freebase.js';
import {getUser, getPlaylists, getPlaylist} from '../model/DAL/spotify.js';
import {getVideo} from '../model/DAL/youtube.js';
import neo4j from '../model/DAL/neo4j.js';
let redis = require('../model/DAL/redis');

//const ONE_HOUR = 1000 * 60 * 60;
const ONE_HOUR = 1000 * 60;

let relate = autoCurry((entity, label, otherEntity) => ({
  start: entity, end: otherEntity, label: label
}));

let newEntities = (entities) =>
  // Get all existing SpotifyEntities with same Spotify id as any of the new
  neo4j.query(`Match (spotify:SpotifyEntity)<--(entity)
               Where spotify.spotifyId IN {ids}
               Return spotify, entity`,
    {ids: entities.entities
      .filter(entity => entity.type === 'SpotifyEntity')
      .map(entity => entity.spotifyId)}
  )
  //.then(existingEntities => existingEntities.map(existingEntity => existingEntity.spotifyId))
  .then(existingEntities => {
    let existingIds = existingEntities.map(entity => ({
      entity: entity.entity.id,
      spotify: entity.spotify.spotifyId,
      spotifyEntityId: entity.spotify.id,
    }));

    // Add existing ids to entities
    entities.relations
      .filter(relation => relation.end.type === 'SpotifyEntity')
      .forEach(relation => {
        let existingId = existingIds.filter(id => id.spotify === relation.end.spotifyId);

        if (existingId.length) {
          relation.start.id = existingId[0].entity;
          relation.end.id = existingId[0].spotifyEntityId;
        }
      });

    return {entities: entities.entities, relations: entities.relations};
  });

let newVideos = (entities) =>
  // Get all existing SpotifyEntities with same Spotify id as any of the new
  neo4j.query(`Match (video:YouTubeVideo)<--(entity)
               Where video.youtubeId IN {ids}
               Return video, entity`,
    {ids: entities.entities
      .filter(entity => entity.type === 'YouTubeVideo')
      .map(entity => entity.youtubeId)}
  )
    //.then(existingEntities => existingEntities.map(existingEntity => existingEntity.spotifyId))
    .then(existingEntities => {
      let existingIds = existingEntities.map(entity => ({
        entity: entity.entity.id,
        video: entity.video.youtubeId,
        videoId: entity.video.id,
      }));

      // Add existing ids to entities
      entities.relations
        .filter(relation => relation.end.type === 'YouTubeVideo')
        .forEach(relation => {
          let existingId = existingIds.filter(id => id.video === relation.end.youtubeId);

          if (existingId.length) {
            relation.start.id = existingId[0].entity;
            relation.end.id = existingId[0].videoId;
          }
        });

      return {entities: entities.entities, relations: entities.relations};
    });

/**
 * Updates the update time to current time
 * @param {SpotifyEntity} spotifyEntity
 */
let touch = (spotifyEntity) => {
  spotifyEntity.updated = Date.now();
  neo4j.save([spotifyEntity]);
};

let getUserPlaylists = (userId, token, spotifyProfile, modifiedSince) =>
  getPlaylists(token, spotifyProfile.spotifyEntity.spotifyId, modifiedSince)
    //.doOnNext(console.log)
    .doOnCompleted(() => console.log('getPlaylists'))
    .flatMap(playlist => {
      //console.log(playlist);

      let data = {
        entities: [
          spotifyProfile.user,
          spotifyProfile.spotifyEntity,
          playlist.playlist,
          playlist.spotifyEntity
        ],
        relations: [
          relate(spotifyProfile.user, 'owns', playlist.playlist),
          relate(playlist.playlist, 'is', playlist.spotifyEntity),
        ],
      };

      return getPlaylist(token, playlist.tracks, modifiedSince)
        .doOnError(console.log)
        .doOnCompleted(() => console.log('getPlaylist'))
        .flatMap(playlistData => {
          data.entities = data.entities.concat(playlistData.entities);
          data.relations = data.relations
            .concat(playlistData.relations)
            .concat(playlistData.entities
              .filter(entity => entity.type === 'Song')
              .map(relate(playlist.playlist, 'contains'))
          );
          return newEntities(data)
            .then(data => {
              let newArtists = data.entities
                .filter(entity => entity.id === undefined)
                .filter(entity => entity.type === 'Artist');

              let freebaseArtists = newArtists
                .map(artist => artist.name)
                .map(getArtist);

              return Promise.all([
                neo4j.create(data.entities, data.relations)
              ].concat(freebaseArtists))
                .then(promises => promises.slice(1))
                .then(freebaseArtists => {
                  let data = {
                    entities: newArtists.concat(
                      freebaseArtists.filter(artist => artist !== undefined)
                    ),
                    relations: [],
                  };
                  newArtists.forEach((artist, index) => {
                    if (freebaseArtists[index] !== undefined) {
                      data.relations.push(relate(artist, 'is', freebaseArtists[index]));
                    }
                  });

                  return neo4j.create(data.entities, data.relations);
                });
            });
        });
    })
    .doOnError(() =>
      redis.del(`updating-${userId}`)
        .then(() => redis.pub(`updated-${userId}`, false))
    )
    .doOnCompleted(() => console.log('flatMap'))
    .subscribeOnCompleted(() => {
      console.log('completyd');
      neo4j.query(`Match (song:Song)-->(:Artist)-->(artist:FreebaseEntity)
                   Where not (:YouTubeVideo)<--(song:Song)
                   Return song, artist`)
        .then(rows => Promise.all(
          rows.map(row => getVideo(row.song, row.artist.mid))
        ))
        .then(videos => {
          let data = {
            entities: [],
            relations: [],
          };
          videos
            .filter(video => video !== undefined)
            .forEach(video => {
              console.log('video for', video.song.name);
              data.entities.push(video.song);
              data.entities.push(video.video);
              data.entities.push(video.thumbnail);

              data.relations.push(relate(video.song, 'video', video.video));
              data.relations.push(relate(video.video, 'thumbnail', video.thumbnail));
            });

          return newVideos(data);
        })
        .then(data => neo4j.create(data.entities, data.relations))
        .then(() => console.log('done'))
        .then(() => redis.del(`updating-${userId}`))
        .then(() => redis.pub(`updated-${userId}`, true))
        .catch(() =>
          redis.del(`updating-${userId}`)
            .then(() => redis.pub(`updated-${userId}`, false)));
    });

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
                .then(() => console.log('Here'))
                .then(() => neo4j.query(
                  'Match (:SpotifyEntity {spotifyId : {spotifyId}})<--(user:User) Return user.id',
                  {spotifyId: spotifyProfile.spotifyEntity.spotifyId}
                ))
                .then((result) => {
                  console.log(result)
                  if (!result[0]) {
                    reject();
                  }
                  user.session.data.userId = result[0]['user.id'];
                  return user.session.save();
                })
                .then(() => console.log('Here1'))
                .then(() => redis.set(`updating-${user.session.data.userId}`, true))
                .catch(console.error)
                .then(() => console.log('Here2'))
                .then(resolve)
                .then(() => console.log('Here3'))
                .then(() => getUserPlaylists(user.session.data.userId, user.token, spotifyProfile));
            }
          })
          .catch(reject);
      }, reject);
  });
