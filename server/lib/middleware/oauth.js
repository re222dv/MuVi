let base64id = require('base64id');
let oauth2 = require('simple-oauth2');
let Rx = require('rx');

var authedTokens = new Rx.Subject();

/**
 * Handles oauth sign ins
 *
 * @param server Handled by Hapi
 * @param options Options object
 * @callback {String} options.host Base host path
 * @param {Array.<{
 *    clientId: String,
 *    clientSecret: String,
 *    name: String,
 *    site: String,
 *    authorizationPath:
 *    String, tokenPath: String
 *  }>} [options.providers]
 * @callback [options.callback] Called on sign in, should return a promise
 * @param next Handled by Hapi
 */
let register = (server, options, next) => {
  options.providers = options.providers || [];
  options.callback = options.callback || Promise.resolve();

  options.providers.forEach(provider => {
    let callbackUrl = `${options.host}/auth/${provider.name}/callback`;
    let providerConfig = oauth2({
      clientID: provider.clientId,
      clientSecret: provider.clientSecret,
      site: provider.site,
      authorizationPath: provider.authorizationPath,
      tokenPath: provider.tokenPath,
    });

    server.route([
      {
        method: 'GET',
        path: `/auth/${provider.name}`,
        handler: (request, reply) => {
          request.session.oauth = (request.session.oauth) || {};
          request.session.oauth[provider.name] = (request.session.oauth[provider.name]) || {};

          let state = base64id.generateId();
          request.session.oauth[provider.name].state = state;

          reply.redirect(providerConfig.authCode.authorizeURL({
            redirect_uri: callbackUrl,
            scope: provider.scope,
            state: state
          }));
        },
      },
      {
        method: 'GET',
        path: `/auth/${provider.name}/callback`,
        handler: (request, reply) => {
          if (request.query.state !== request.session.oauth[provider.name].state) {
            return reply.redirect('/').temporary(true);
          }

          let state = base64id.generateId();
          request.session.oauth[provider.name].state = state;

          providerConfig.authCode.getToken(
            {
              redirect_uri: callbackUrl,
              code: request.query.code,
              state: state
            },
            (error, token) => {
              if (error) {
                return reply.redirect('/').temporary(true);
              }

              token.expiresAt = Date.now() + token.expires_in * 1000;
              request.session.oauth[provider.name].token = token;
              options.callback({
                provider: provider.name,
                token: token,
                session: request.sessionObject
              })
                .then(() => reply.redirect('/').temporary(true))
                .catch((e) => {
                  console.error('oauth error', e);
                  reply.redirect('/').temporary(true);
                });
            }
          );
        },
      },
    ]);

    server.ext('onPreAuth', (request, reply) => {
      try {
        if (request.session.oauth) {
          Object.keys(request.session.oauth)
            .map(provider => request.session.oauth[provider])
            .filter(provider => provider.token)
            .forEach(provider => {
              provider.token.expires_in = provider.token.expiresAt - Date.now();
              let token = providerConfig.accessToken.create(provider.token);
              provider.token.expired = token.expired;
              provider.token.refresh = token.refresh;
              provider.token.revoke = token.revoke;
            });
        }
      } catch (e) {
        console.error(e);
      }

      reply.continue();
    });
  });

  return next();
};

register.attributes = {
  name: 'oauth',
  version: '1.0.0'
};

module.exports = register;
module.exports.authedTokens = authedTokens;
