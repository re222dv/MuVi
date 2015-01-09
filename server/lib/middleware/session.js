import Session from '../services/session.js';

let setCookie = (reply, sessionId) => {
  reply.state('sessionId', sessionId, {
    isSecure: false,
    isHttpOnly: true,
    path: '/',
  });
};

let register = (server, options, next) => {

  server.ext('onPreAuth', (request, reply) => {
    var sessionId = request.state.sessionId;

    if (!sessionId) {
      request.sessionObject = Session.create();
      request.session = request.sessionObject.data;
      setCookie(reply, request.sessionObject.id);
      reply.continue();
    } else {
      Session.restore(sessionId)
        .then(session => {
          if (!session.data) {
            console.log('new session');
            session = Session.create();
            setCookie(reply, session.id);
          }

          return session;
        })
        .then(session => request.sessionObject = session)
        .then(session => request.session = session.data)
        .then(() => reply.continue());
    }
  });

  server.ext('onPreResponse', (request, reply) => {
    if (request.sessionObject.isDestroyed) {
      //reply.unstate('sessionId');
      setCookie(reply, null);
      reply.continue();
    } else {
      if (request.response.header) {
        request.response.header('Access-Control-Allow-Credentials', 'true');
      }
      request.sessionObject.save()
        .then(() => reply.continue());
    }
  });

  server.route([{
    method: 'GET',
    path: '/auth/logout',
    handler: (request, reply) => {
      request.sessionObject.destroy();

      reply();
    },
  }]);

  return next();
};

register.attributes = {
  name: 'session',
  version: '1.0.0'
};

module.exports = register;
