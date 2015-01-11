let request = require('request');
let Rx = require('rx');

/**
 * Requests a http resource with OAuth authorization
 * @param {OAuthToken} token
 * @param {string} method
 * @param {string} url
 * @param {Date|number} [modifiedSince] Only return if the resource have been updated since
 * @returns {Rx.Observable<string>}
 */
let oauthRequest = (token, method, url, modifiedSince) => {
  let tokenPromise = Promise.resolve(token.access_token);
  // TODO Handle expired token (Not currently needed)
  //if (token.expired()) {
  //  console.log('refresh');
  //  token.refresh(function (error, result) {
  //    console.log('new token error');
  //    console.log(error);
  //    console.log('new token result');
  //    console.log(result);
  //  });
  //}

  let response = new Rx.Subject();

  let headers = {};
  if (modifiedSince) {
    if (typeof modifiedSince === 'number') {
      modifiedSince = new Date(modifiedSince);
    }
    headers['If-Modified-Since'] = modifiedSince.toUTCString();
  }

  console.warn(url);
  tokenPromise
    .then(accessToken => request(url, {
      method: method,
      auth: {
        bearer: accessToken
      },
      headers: headers,
    }, (err, result, body) => {
      if (err) {
        response.onError(err);
      } else {
        response.onNext(result.statusCode === 304 ? null : body);
      }
      response.onCompleted();
      response.dispose();
    }));

  return response.asObservable();
};

export default oauthRequest;
