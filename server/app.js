var hapi = require('hapi');
var traceur = require('traceur');

// Set up Traceur before importing es6 code
traceur.require.makeDefault(function (filename) {
  // don't transpile our dependencies, just our app
  return filename.indexOf('node_modules') === -1;
});

var oauth = require('./lib/middleware/oauth.js');
var session = require('./lib/middleware/session.js');
var routes = require('./lib/routes.js').routes;
var spotifyService = require('./lib/services/spotify.js');

var spotify = require('./config/spotify.js');

// creating the hapi server instance
var server = new hapi.Server();

// adding a new connection that can be listened on
server.connection({
  port: 9099,
  host: '127.0.0.1',
  routes: {cors: true},
});
server.route(routes);

if (!module.parent) {
  server.register([
    session,
    {
      register: oauth,
      options: {
        host: 'http://localhost:9099',
        providers: [spotify],
      }
    }
  ], function (err) {
    if (err) throw err;

    server.start(function (err) {
      if (err) throw err;
      console.log('Server started', server.info.uri);
    });
  });
}

oauth.authedTokes
  .do(function () {console.warn('app');})
  .filter(function (token) {return token.provider === 'spotify';})
  .map(function (token) {return token.token;})
  .subscribe(spotifyService);

module.exports = server;
