let request = require('request');
let Rx = require('rx');

/**
 * Requests a http resource with OAuth authorization
 * @param {OAuthToken} token
 * @param {string} method
 * @param {string} url
 * @returns {Rx.Observable<string>}
 */
let oauthRequest = (token, method, url) => {
  let tokenPromise = Promise.resolve(token.access_token);
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

  console.warn(url);
  tokenPromise
    .then(accessToken => request(url, {
      method: method,
      auth: {
        bearer: accessToken
      },
    }, (err, result, body) => {
      if (err) {
        response.onError(err);
      } else {
        response.onNext(body);
      }
      response.onCompleted();
      response.dispose();
    }));

  return response;
};

export default oauthRequest;
