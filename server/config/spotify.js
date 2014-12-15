import {clientId, clientSecret} from './spotify_secret.js';

/**
 * spotify_secret.js contains and exports the secret keys
 * Template:
 *   export var clientId = 'CLIENT ID';
 *   export var clientSecret = 'CLIENT SECRET';
 */

module.exports = {
  name: 'spotify',
  clientId: clientId,
  clientSecret: clientSecret,
  site: 'https://accounts.spotify.com',
  authorizationPath: '/authorize',
  tokenPath: '/api/token',
};
