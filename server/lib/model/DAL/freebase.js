let request = require('request-promise');
import {key} from '../../../config/google_secret.js';

/**
 * Search Freebase for an artist
 *
 * @param {String} name Artist name
 * @returns {Promise<FreebaseEntity>}
 */
export function getArtist(name) {
  let params = {
    query: encodeURIComponent(name),
    filter: encodeURIComponent('(any type:/music/artist)'),
    userIp: encodeURIComponent('178.62.193.154'),
    key: encodeURIComponent(key),
  };
  let queryString = Object.keys(params).map(param => `${param}=${params[param]}`).join('&');
  let url = `https://www.googleapis.com/freebase/v1/search?${queryString}`;

  return request(url)
    .then(JSON.parse)
    .then(response => response.result.length >= 1 ? ({
      type: 'FreebaseEntity',
      mid: response.result[0].mid,
    }) : undefined);
}
