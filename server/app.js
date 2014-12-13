var hapi = require('hapi');
var traceur = require('traceur');

// Set up Traceur before importing es6 code
traceur.require.makeDefault(function (filename) {
  // don't transpile our dependencies, just our app
  return filename.indexOf('node_modules') === -1;
});

var routes = require('./lib/routes.js').routes;

// creating the hapi server instance
var server = new hapi.Server();

// adding a new connection that can be listened on
server.connection({
  port: 9099,
  host: '127.0.0.1',
  labels: ['web']
});

server.route(routes);

if (!module.parent) {
  server.start(function (err) {
    if (err) throw err;
    console.log('Server started', server.info.uri);
  });
}

module.exports = server;
