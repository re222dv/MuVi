let Boom = require('boom');
import neo4j from './model/DAL/neo4j.js';
let redis = require('./model/DAL/redis.js');

export var routes = [
  {
    method: 'GET',
    path: '/api/playlists',
    handler: (request, reply) => {
      if (request.session.userId) {
        redis.get(`updating-${request.session.userId}`)
          .then((updateing) => {
            if (updateing && request.query.wait !== undefined) {
              redis.sub(`updated-${request.session.userId}`)
                .then(subscriber => {
                  let timeout = setTimeout(() => {
                    subscriber.unsubscribe();
                    reply().code(204).header('x-updating', 'updating');
                  }, 20000);

                  subscriber.on('message', (_, status) => {
                    if (status === 'completed') {
                      subscriber.unsubscribe();
                    }
                    neo4j.getUserPlaylists(request.session.userId)
                      .then(playlists => {
                        clearTimeout(timeout);
                        if (status !== 'completed') {
                          reply(playlists).header('x-updating', 'updating');
                        } else {
                          reply(playlists);
                        }
                      });
                  });
                });
            } else {
              neo4j.getUserPlaylists(request.session.userId)
                .then(playlists => {
                  if (updateing) {
                    reply(playlists).header('x-updating', 'updating');
                  } else {
                    reply(playlists);
                  }
                });
            }
          });
      } else {
        reply(Boom.unauthorized());
      }
    },
  },
  {
    method: 'GET',
    path: '/api/playlists/{id}',
    handler: (request, reply) => {
      if (request.session.userId) {
        neo4j.getPlaylist(request.session.userId, request.params.id)
          .then((playlist) => {
            if (playlist) {
              reply(playlist);
            } else {
              reply(Boom.notFound());
            }
          });
      } else {
        reply(Boom.unauthorized());
      }
    },
  },
];
