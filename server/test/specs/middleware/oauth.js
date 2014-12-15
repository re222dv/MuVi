let chai = require('chai');
let hapi = require('hapi');
let mockery = require('mockery');
let sinon = require('sinon');
let spotify = require('../../../config/spotify.js');
import {mockRedis} from '../../mocks/redis.js';

let expect = chai.expect;
chai.use(require('sinon-chai'));

describe('oauth middleware', () => {
  let server, request, oauthObject, getTokenSpy, tokenObject;
  let authError;

  beforeEach((done) => {
    mockRedis();
    authError = null;
    getTokenSpy = sinon.spy();
    oauthObject = {
      authCode: {
        authorizeURL: sinon.stub().returns('authorizationUrl'),
        getToken: (config, callback) => {
          getTokenSpy(config);
          callback(authError, {
            access_token: 'some token',
            token_type: 'Bearer',
            expires_in: 3600,
            refresh_token: 'some other token',
          });
        },
      },
      accessToken: {
        create: () => tokenObject,
      },
    };
    tokenObject = {
      expired: sinon.spy(),
      refresh: sinon.spy(),
      revoke: sinon.spy(),
    };
    let oauthMock = sinon.stub().returns(oauthObject);
    mockery.registerMock('simple-oauth2', oauthMock);
    mockery.registerMock('spotify_secret.js', {
      clientId: 'CLIENT ID',
      clientSecret: 'CLIENT SECRET',
    });

    mockery.enable({
      warnOnReplace: false,
      warnOnUnregistered: false,
    });

    server = new hapi.Server();

    let oauth = require('../../../lib/middleware/oauth.js');
    let session = require('../../../lib/middleware/session.js');

    server.connection({
      port: 9099,
      host: '127.0.0.1'
    });

    server.register([session, {register: oauth, options: {
      host: 'http://localhost:9099',
      providers: [spotify],
    }}, require('inject-then')], function (err) {
      if (err) throw err;

      server.route([{
        method: 'GET',
        path: '/',
        handler: (req, reply) => {
          request = req;
          reply('');
        }
      }]);
      done();
    });

  });

  afterEach(mockery.disable);

  it('should redirect to the auth url', () =>
    server.injectThen({url: '/'})
    .then(() => server.injectThen({url: '/auth/spotify', headers: {
      Cookie: `sessionId=${request.sessionObject.id};`
    }}))
    .then(response => {
      expect(response.statusCode).to.equal(302);
      expect(response.headers.location).to.equal('authorizationUrl');
      expect(oauthObject.authCode.authorizeURL).to.have.been.calledWith({
        redirect_uri: 'http://localhost:9099/auth/spotify/callback',
        scope: undefined,
        state: request.session.oauth.spotify.state,
      });
    })
  );

  it('should validate the state on callback', () =>
    server.injectThen({url: '/'})
      .then(() => server.injectThen({url: '/auth/spotify', headers: {
        Cookie: `sessionId=${request.sessionObject.id};`
      }}))
      .then(() => server.injectThen({url: '/auth/spotify/callback?code=code&state=state', headers: {
        Cookie: `sessionId=${request.sessionObject.id};`
      }}))
      .then(response => {
        expect(response.statusCode).to.equal(400);
      })
      .then(() => request.session.oauth.spotify.state)
      .then((state) => server.injectThen({url: `/auth/spotify/callback?code=code&state=${state}`,
        headers: {
          Cookie: `sessionId=${request.sessionObject.id};`
        }
      }))
      .then(response => {
        expect(response.statusCode).to.equal(200);
      })
  );

  it('should request a token', () =>
    server.injectThen({url: '/'})
      .then(() => server.injectThen({url: '/auth/spotify', headers: {
        Cookie: `sessionId=${request.sessionObject.id};`
      }}))
      .then(() => request.session.oauth.spotify.state)
      .then((state) => server.injectThen({url: `/auth/spotify/callback?code=code&state=${state}`,
        headers: {
          Cookie: `sessionId=${request.sessionObject.id};`
        }
      }))
      .then(() => {
        expect(getTokenSpy).to.have.been.calledWith({
          redirect_uri: 'http://localhost:9099/auth/spotify/callback',
          code: 'code',
          state: request.session.oauth.spotify.state
        });
      })
  );

  it('should return unauthorized when authorization fails', () =>
    server.injectThen({url: '/'})
      .then(() => authError = 'error')
      .then(() => server.injectThen({url: '/auth/spotify', headers: {
        Cookie: `sessionId=${request.sessionObject.id};`
      }}))
      .then(() => request.session.oauth.spotify.state)
      .then((state) => server.injectThen({url: `/auth/spotify/callback?code=code&state=${state}`,
        headers: {
          Cookie: `sessionId=${request.sessionObject.id};`
        }
      }))
      .then(response => {
        expect(response.statusCode).to.equal(401);
      })
  );

  it('should save the token in the session on success', () =>
    server.injectThen({url: '/'})
      .then(() => server.injectThen({url: '/auth/spotify', headers: {
        Cookie: `sessionId=${request.sessionObject.id};`
      }}))
      .then(() => request.session.oauth.spotify.state)
      .then((state) => server.injectThen({url: `/auth/spotify/callback?code=code&state=${state}`,
        headers: {
          Cookie: `sessionId=${request.sessionObject.id};`
        }
      }))
      .then(() => server.injectThen({url: '/', headers: {
        Cookie: `sessionId=${request.sessionObject.id};`
      }}))
      .then(() => {
        console.log(request.session.oauth.spotify.token);
        let token = request.session.oauth.spotify.token;
        expect(token).to.ok();
        expect(token.expires_in).to.be.within(3500 * 1000, 3600 * 1000);
        expect(token.expiresAt).to.be.within(Date.now() + 3500 * 1000, Date.now() + 3600 * 1000);
        expect(token.access_token).to.equal('some token');
        expect(token.token_type).to.equal('Bearer');
        expect(token.refresh_token).to.equal('some other token');
        expect(token.expired).to.equal(tokenObject.expired);
        expect(token.refresh).to.equal(tokenObject.refresh);
        expect(token.revoke).to.equal(tokenObject.revoke);
      })
  );
});
