import neo4j from './model/DAL/neo4j';
import spotify from './model/DAL/spotify.js';

export var routes = [
  {
    method: 'GET',
    path: '/api/test',
    handler: (_, reply) => {
      console.log('here');
      let song = {
        type: 'Song',
        name: 'Test',
        durationMs: 500,
        number: 1,
        popularity: 50,
      };
      let album = {
        type: 'Album',
        name: 'Test',
        year: 2014,
        popularity: 50,
      };
      let artist = {
        type: 'Artist',
        name: 'Test',
        popularity: 50,
      };
      let playlist = {
        type: 'Playlist',
        name: 'Test',
      };
      neo4j.create([
        song, album, artist, playlist
      ], [
        {start: song, end: album, label: 'Album'},
        {start: album, end: artist, label: 'Artist'},
        {start: playlist, end: song, label: 'Song'},
      ]).then(() => reply('saved')).catch(err => {throw err;});
    },
  },
  {
    method: 'GET',
    path: '/api/playlist/{id}',
    handler: (request, reply) =>
      neo4j.getPlaylist(request.params.id).then(reply),
  },
  {
    method: 'GET',
    path: '/my',
    handler: (request, reply) => {
      spotify(request.session.oauth.spotify.token).doOnError(() => console.log('doOnError')).subscribeOnCompleted(() => console.log('doOnCompleted'));
      reply('downloading');
    }
  },
  {
    method: 'GET',
    path: '/songs',
    handler: (request, reply) => {
      neo4j.getEntities('Song').then(reply);
    }
  },
];
