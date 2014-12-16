let request = require('request');
let Rx = require('rx');

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
      response.dispose();
    }));

  console.warn(url);

  return response;
};

export default oauthRequest;
