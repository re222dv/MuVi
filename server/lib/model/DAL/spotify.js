let Rx = require('rx');
import request from '../../services/oauth_request.js';

export default function getPlaylists(token) {
  let downloaded = new Rx.Subject();

  let createSpotifyEntity = (callback) => (entity) => {
    let spotifyEntity = {
      type: 'SpotifyEntity',
      spotifyId: entity.id,
      spotifyType: entity.type,
    };
    return callback(spotifyEntity, entity);
  };

  let createUser = createSpotifyEntity((spotifyEntity, user) => {
    console.log('Create user');
    let entities = [{
      type: 'User',
      name: user.display_name,
    }, spotifyEntity];

    downloaded.onNext({entities, relations: [{start: entities[0], end: spotifyEntity}]});
    return {entity: entities[0], id: spotifyEntity.spotifyId};
  });

  let createPlaylistsFor = (user) => (playlists) => {
    let entities = [user];
    let relations = [];

    playlists.forEach(createSpotifyEntity((spotifyEntity, playlist) => {
      let entity = {
        type: 'Playlist',
        name: playlist.name,
      };

      entities.push(entity);
      entities.push(spotifyEntity);
      relations.push({start: user, end: entities[entities.length - 2]});
      relations.push({start: entity, end: spotifyEntity});
    }));

    downloaded.onNext({entities, relations});
    return playlists.map((playlist, index) => ({
      entity: entities[index * 2 + 1], // Account for the SpotifyEntity and User
      tracks: playlist.tracks.href,
    }));
  };

  let createMusicEntitiesFor = (playlist) => (songs) => {
    let entities = [playlist];
    let relations = [];

    let albums = [];
    let artists = [];

    songs.forEach(createSpotifyEntity((spotifyEntity, song) => {
      let songEntities = [{
        type: 'Song',
        name: song.name,
        popularity: song.popularity,
        durationMs: song.duration_ms,
        number: song.track_number,
      },  spotifyEntity
      ];
      let songRelations = [
        {start: playlist, end: songEntities[0]},
        {start: songEntities[0], end: spotifyEntity},
      ];

      if (albums.indexOf(song.album.id) === -1) { // The album haven't been instantiated
        songEntities = songEntities.concat([{
          type: 'Album',
          name: song.album.name,
          //year: song.album.release_date.split('-', 1)[0], // Only get the year
          albumType: song.album.album_type,
        }, {
          type: 'SpotifyEntity',
          spotifyId: song.album.id,
          spotifyType: song.album.type,
        }]);
        songRelations = songRelations.concat([
          {start: songEntities[0], end: songEntities[2]}, // Song to Album
          {start: songEntities[2], end: songEntities[3]}, // Album to SpotifyEntity
        ]);
        albums.push(song.album.id);
      } else {
        let album = relations
          .filter(relation => relation.start.type === 'Album')
          .filter(relation => relation.end.type === 'SpotifyEntity')
          .filter(relation => relation.end.spotifyId === song.album.id)
          .map(relation => relation.start)[0];

        songRelations.push({start: songEntities[0], end: album}); // Song to Album
      }

      song.artists
        .forEach(createSpotifyEntity((spotifyEntity, artist) => {
          if (artists.indexOf(artist.id) === -1) {
            // The artist haven't been instantiated
            let artistEntities = [{
              type: 'Artist',
              name: artist.name,
            }, spotifyEntity];

            songEntities = songEntities.concat(artistEntities);
            songRelations = songRelations.concat([
              {start: songEntities[0], end: artistEntities[0]}, // Song to Artist
              {start: artistEntities[0], end: spotifyEntity}
            ]);
            artists.push(artist.id);
          } else {
            let oldArtist = relations
              .filter(relation => relation.start.type === 'Artist')
              .filter(relation => relation.end.type === 'SpotifyEntity')
              .filter(relation => relation.end.spotifyId === artist.id)
              .map(relation => relation.start)[0];

            songRelations.push({start: songEntities[0], end: oldArtist}); // Song to Artist
          }
        }));

      entities = entities.concat(songEntities);
      relations = relations.concat(songRelations);
    }));

    downloaded.onNext({entities, relations});
  };

  let spotify = (url) => request(token, 'GET', url);
  let spotifyPath = (path) => spotify(`https://api.spotify.com/v1${path}`);

  Rx.Observable.fromPromise(spotifyPath('/me'))
    .map(JSON.parse)
    .map(createUser)
    .flatMap((user, index, observable) =>
      observable
        .map(user => user.id)
        .flatMap(id => spotifyPath(`/users/${id}/playlists`))
        .map(JSON.parse)
        .map(response => response.items)
        .flatMap(createPlaylistsFor(user.entity))
    )
    .flatMap((playlist, index, observable) =>
      observable
        .map(playlist => playlist.tracks)
        .flatMap(spotify)
        .map(JSON.parse)
        .map(response => response.items.map(item => item.track))
        .map(createMusicEntitiesFor(playlist.entity))
    )
    .subscribe();

  return downloaded;
}
