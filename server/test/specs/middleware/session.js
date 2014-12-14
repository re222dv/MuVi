let expect = require('chai').expect;
let hapi = require('hapi');
let mockery = require('mockery');
import {mockRedis} from '../../mocks/redis';

describe('session middleware', () => {
  let server, request;

  beforeEach((done) => {
    mockRedis();
    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
    });

    server = new hapi.Server();

    let session = require('../../../lib/middleware/session');

    server.connection({
      port: 9099,
      host: '127.0.0.1'
    });

    server.register([session, require('inject-then')], function (err) {
      if (err) throw err;

      server.route([
        {
          method: 'GET',
          path: '/',
          handler: (req, reply) => {
            request = req;
            reply('');
          }
        },
        {
          method: 'GET',
          path: '/set',
          handler: (req, reply) => {
            request = req;
            request.session.message = 'Some message';
            reply('');
          }
        },
        {
          method: 'GET',
          path: '/get',
          handler: (request, reply) => {
            reply(request.session.message);
          }
        },
        {
          method: 'GET',
          path: '/del',
          handler: (request, reply) => {
            request.sessionObject.destroy()
              .then(() => reply(''));
          }
        },
      ]);
      done();
    });

  });

  afterEach(mockery.disable);

  it('should initialize a new session if there is none', () =>
    server.injectThen({url: '/'})
      .then(response => {
        let cookie = [`sessionId=${request.sessionObject.id}; HttpOnly; Path=/`];

        expect(response.headers['set-cookie']).to.deep.equal(cookie);
      })
  );

  it('should not set a cookie if there already is one', () =>
    server.injectThen({url: '/'})
      .then(() => server.injectThen({url: '/', headers: {
        Cookie: `sessionId=${request.sessionObject.id};`
      }}))
      .then(response => {
        expect(response.headers['set-cookie']).to.be.undefined();
      })
  );

  it('should load data from the previous session', () =>
      server.injectThen({url: '/set'})
        .then(() => server.injectThen({url: '/get', headers: {
          Cookie: `sessionId=${request.sessionObject.id};`
        }}))
        .then(response => {
          expect(response.payload).to.equal('Some message');
        })
  );

  it('should forget data from a destroyed session', () =>
      server.injectThen({url: '/set'})
        .then(() => server.injectThen({url: '/del', headers: {
          Cookie: `sessionId=${request.sessionObject.id};`
        }}))
        .then(() => server.injectThen({url: '/get', headers: {
          Cookie: `sessionId=${request.sessionObject.id};`
        }}))
        .then(response => {
          expect(response.payload).to.be.empty();
        })
  );

  it('should remove the cookie on a destroyed session', () =>
      server.injectThen({url: '/'})
        .then(() => server.injectThen({url: '/del', headers: {
          Cookie: `sessionId=${request.sessionObject.id};`
        }}))
        .then(response => {
          let cookie = ['sessionId=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT'];
          expect(response.headers['set-cookie']).to.deep.equal(cookie);
        })
  );
});
