let base64id = require('base64id');
// NOTICE: Uses require to be able to mock
//import {get, set, del} from '../model/DAL/redis';
let redis = require('../model/DAL/redis');
let get = redis.get, set = redis.set, del = redis.del, expire = redis.expire;

const ONE_HOUR = 1000 * 60 * 60;

function destroy() {
  this.isDestroyed = true;
  return del(`session-${this.id}`);
}

function save() {
  let key = `session-${this.id}`;

  return set(key, this.data).then(() => expire(key, ONE_HOUR));
}

let createSession = (sessionId, data) => (
  {id: sessionId, data, save, destroy}
);

let session = {
  create: () => createSession(base64id.generateId(), {}),
  restore: (sessionId) =>
    get(`session-${sessionId}`)
      .then(data => createSession(sessionId, data))
};

export default session;
