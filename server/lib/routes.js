import neo4j from './model/DAL/neo4j';
import spotify from './model/DAL/spotify.js';

export var routes = [
  {
    method: 'GET',
    path: '/api/playlists',
    handler: (request, reply) => {
      neo4j.getUserPlaylists(request.session.userId).then(reply);
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
