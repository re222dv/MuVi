import neo4j from './model/DAL/neo4j';
import spotify from './model/DAL/spotify.js';

export var routes = [
  {
    method: 'GET',
    path: '/api/playlists',
    handler: (_, reply) => {
      neo4j.getUserPlaylists('0fd726b0-854a-11e4-b1a9-4523d5a16974').then(reply);
    },
  },
  {
    method: 'GET',
    path: '/api/playlists/{id}',
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
