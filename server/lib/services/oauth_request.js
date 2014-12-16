//let autoCurry = require('auto-curry');
let request = require('request-promise');

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

  return tokenPromise
    .then(accessToken => request({
      method: method,
      uri: url,
      auth: {
        bearer: accessToken
      },
    }));
};

export default oauthRequest;
