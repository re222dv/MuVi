let autoCurry = require('auto-curry');
let Rx = require('rx');
import entitiesFromSpotify from '../model/DAL/spotify.js';
import {getArtist} from '../model/DAL/freebase.js';
import {getUser, getPlaylists, getPlaylist} from '../model/DAL/spotify.js';
import {getVideo} from '../model/DAL/youtube.js';
import neo4j from '../model/DAL/neo4j.js';

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

/**
 * Updates the update time to current time
 * @param {SpotifyEntity} spotifyEntity
 */
let touch = (spotifyEntity) => {
  spotifyEntity.updated = Date.now();
  neo4j.save([spotifyEntity]);
};

module.exports = Rx.Observer.create(user => {
  getUser(user.token)
    .subscribe(spotifyProfile => {
      neo4j.query(`Match (spotify:SpotifyEntity {spotifyId : {spotifyId}})<--(user:User) Return user, spotify`,
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
              return user.session.save();
            } else {
              console.log('Updating user details');
              touch(existingUser.spotify);
            }
          }

          return getPlaylists(user.token, spotifyProfile.spotifyEntity.spotifyId, modifiedSince)
            .doOnNext(console.log)
            .flatMap(playlist => {
              console.log(playlist);

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

              return getPlaylist(user.token, playlist.tracks, modifiedSince)
                .doOnError(console.log)
                .map(playlistData => {
                  console.log('Here');
                  data.entities = data.entities.concat(playlistData.entities);
                  data.relations = data.relations
                    .concat(playlistData.relations)
                    .concat(playlistData.entities
                      .filter(entity => entity.type === 'Song')
                      .map(relate(playlist.playlist, 'contains'))
                  );
                  console.log(data.entities);
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
                        })
                        .catch(console.error);
                    })
                    .then(() =>
                      neo4j.query(`Match (song:Song)-->(:Artist)-->(artist:FreebaseEntity)
                               Where not (:YouTubeVideo)<--(song:Song)
                               Return song, artist`)
                    )
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
                          data.entities.push(video.song);
                          data.entities.push(video.video);
                          data.entities.push(video.thumbnail);

                          data.relations.push(relate(video.song, 'video', video.video));
                          data.relations.push(relate(video.video, 'thumbnail', video.thumbnail));
                        });

                      return neo4j.create(data.entities, data.relations);
                    })
                    .catch(console.error);
                });
            })
            .doOnError(console.log)
            .subscribeOnCompleted(() => {
              console.log('done');
            });

          //if (existingUser) {
          //  user.session.data.userId = existingUser.id;
          //  // TODO
          //  console.log('User exists');
          //  return user.session.save();
          //} else {
          //  let data = {
          //    entities: [spotifyProfile.user, spotifyProfile.spotifyEntity],
          //    relations: [relate(spotifyProfile.user, 'is', spotifyProfile.spotifyEntity)],
          //  };
          //
          //  return getPlaylists(token, spotifyProfile.spotifyEntity.spotifyId)
          //    .flatMap(playlist => {
          //      data.entities = data.entities.concat([playlist.playlist, playlist.spotifyEntity]);
          //      data.relations = data.relations.concat([
          //        relate(spotifyProfile.user, 'owns', playlist.playlist),
          //        relate(playlist.playlist, 'is', playlist.spotifyEntity),
          //      ]);
          //
          //      return getPlaylist(token, playlist.tracks)
          //        .doOnError(console.log)
          //        .doOnNext(playlistData => {
          //          data.entities = data.entities.concat(playlistData.entities);
          //          data.relations = data.relations
          //            .concat(playlistData.relations)
          //            .concat(playlistData.entities
          //              .filter(entity => entity.type === 'Song')
          //              .map(relate(playlist.playlist, 'contains'))
          //            );
          //        });
          //    })
          //    .doOnError(console.log)
          //    .subscribeOnCompleted(() => {
          //      newEntities(data)
          //        .then(data => {
          //          let newArtists = data.entities
          //            .filter(entity => entity.id === undefined)
          //            .filter(entity => entity.type === 'Artist');
          //
          //          let freebaseArtists = newArtists
          //            .map(artist => artist.name)
          //            .map(getArtist);
          //
          //          return Promise.all([
          //            neo4j.create(data.entities, data.relations)
          //          ].concat(freebaseArtists))
          //            .then(promises => promises.slice(1))
          //            .then(freebaseArtists => {
          //              let data = {
          //                entities: newArtists.concat(
          //                  freebaseArtists.filter(artist => artist !== undefined)
          //                ),
          //                relations: [],
          //              };
          //              newArtists.forEach((artist, index) => {
          //                if (freebaseArtists[index] !== undefined) {
          //                  data.relations.push(relate(artist, 'is', freebaseArtists[index]));
          //                }
          //              });
          //
          //              return neo4j.create(data.entities, data.relations);
          //            })
          //            .catch(console.error)
          //          ;
          //        })
          //        .then(() =>
          //          neo4j.query(`Match (song:Song)-->(:Artist)-->(artist:FreebaseEntity)
          //                       Where not (:YouTubeVideo)<--(song:Song)
          //                       Return song, artist`)
          //        )
          //        .then(rows => Promise.all(
          //          rows.map(row => getVideo(row.song, row.artist.mid))
          //        ))
          //        .then(videos => {
          //          let data = {
          //            entities: [],
          //            relations: [],
          //          };
          //          videos
          //            .filter(video => video !== undefined)
          //            .forEach(video => {
          //              data.entities.push(video.song);
          //              data.entities.push(video.video);
          //              data.entities.push(video.thumbnail);
          //
          //              data.relations.push(relate(video.song, 'video', video.video));
          //              data.relations.push(relate(video.video, 'thumbnail', video.thumbnail));
          //            });
          //
          //          return neo4j.create(data.entities, data.relations);
          //        })
          //        .catch(console.error);
          //    });
          //}
        })
        .catch(console.log);
    });
});
