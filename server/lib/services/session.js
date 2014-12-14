let base64id = require('base64id');
// NOTICE: Uses require to be able to mock
//import {get, set, del} from '../model/DAL/redis';
let redis = require('../model/DAL/redis');
let get = redis.get, set = redis.set, del = redis.del;

function destroy() {
  this.isDestroyed = true;
  return del(`session-${this.id}`);
}

function save() {
  return set(`session-${this.id}`, this.data);
}

let createSession = (sessionId, data) => (
  {id: sessionId, data: data, save: save, destroy: destroy}
);

let session = {
  create: () => createSession(base64id.generateId(), {}),
  restore: (sessionId) =>
    get(`session-${sessionId}`)
      .then(data => createSession(sessionId, data))
};

export default session;
