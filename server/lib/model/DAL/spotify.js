import request from '../../services/oauth_request.js';

/**
 * @param {OAuthToken} token
 * @param {string} path
 * @returns {Rx.Observable<string>}
 */
let spotifyPath = (token, path) => request(token, 'GET', `https://api.spotify.com/v1${path}`);

/**
 * A wrapper that creates a SpotifyEntity from a spotify object.
 * Callback is called with (SpotifyEntity, spotifyObject)
 */
let createSpotifyEntity = (callback) => (entity) => callback({
  type: 'SpotifyEntity',
  spotifyId: entity.id,
  spotifyType: entity.type,
}, entity);

let createMusicEntities = (songs) => {
  let entities = [];
  let relations = [];

  let albums = [];
  let artists = [];

  songs
    .filter(song => !!song.id)
    .forEach(createSpotifyEntity((spotifyEntity, song) => {
      let songEntities = [{
        type: 'Song',
        name: song.name,
        popularity: song.popularity,
        durationMs: song.duration_ms,
        number: song.track_number,
      },  spotifyEntity];
      let songRelations = [{start: songEntities[0], end: spotifyEntity}];

      if (albums.indexOf(song.album.id) === -1) { // The album haven't been instantiated
        (createSpotifyEntity((spotifyEntity, album) => {
          songEntities = songEntities.concat([{
            type: 'Album',
            name: album.name,
            //year: song.album.release_date.split('-', 1)[0], // Only get the year
            albumType: album.album_type,
          }, spotifyEntity]);
          songRelations = songRelations.concat([
            {start: songEntities[0], end: songEntities[2]}, // Song to Album
            {start: songEntities[2], end: songEntities[3]}, // Album to SpotifyEntity
          ]);
          albums.push(song.album.id);
        }))(song.album);
      } else {
        let album = relations // Get the instantiated album
          .filter(relation => relation.start.type === 'Album')
          .filter(relation => relation.end.type === 'SpotifyEntity')
          .filter(relation => relation.end.spotifyId === song.album.id)
          .map(relation => relation.start)[0];

        songRelations.push({start: songEntities[0], end: album}); // Song to Album
      }

      song.artists.forEach(createSpotifyEntity((spotifyEntity, artist) => {
        if (artists.indexOf(artist.id) === -1) { // The artist haven't been instantiated
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
          let oldArtist = relations // Get the instantiated artist
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

  return {entities, relations};
};

/**
 * Get the current user
 * @param {OAuthToken} token
 * @returns Rx.Observable<{{user: User, spotifyEntity: SpotifyEntity}}>
 */
export function getUser(token) {
  return spotifyPath(token, '/me')
    .map(JSON.parse)
    .map(createSpotifyEntity((spotifyEntity, user) => ({
      user: {
        type: 'User',
        name: user.display_name,
      },
      spotifyEntity,
    })));
}

/**
 * Get playlists for user
 * @param {OAuthToken} token
 * @param {string} userId Spotify id for the user
 * @returns Rx.Observable<{{playlist: Playlist, spotifyEntity: SpotifyEntity}}>
 */
export function getPlaylists(token, userId) {
  return spotifyPath(token, `/users/${userId}/playlists`)
    .map(JSON.parse)
    .flatMap(response => response.items)
    .map(createSpotifyEntity((spotifyEntity, playlist) => ({
      playlist: {
        type: 'Playlist',
        name: playlist.name,
      },
      tracks: playlist.tracks.href,
      spotifyEntity,
    })));
}

/**
 * Get playlists for user
 * @param {OAuthToken} token
 * @param {string} url The url to the playlist tracks resource
 * @returns Rx.Observable<Array.<{entities: Song|Album|Artist|SpotifyEntity, relations: Relation}>>
 */
export function getPlaylist(token, url) {
  return request(token, 'GET', url)
    .map(JSON.parse)
    .map(response => response.items.map(item => item.track))
    .map(createMusicEntities);
}
