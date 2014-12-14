var mockery = require('mockery');

export var redisData = {};

let redisMock = {
  del: (key) => {
    delete redisData[key];
    return Promise.resolve();
  },
  get: (key) => Promise.resolve(redisData[key]),
  set: (key, value) => Promise.resolve(redisData[key] = value),
};

export function mockRedis() {
  mockery.registerMock('../model/DAL/redis', redisMock);
}
