export var redis = require('then-redis');

export var client = redis.createClient();

export var del = (key) => client.del(key);
export var get = (key) => client.hgetall(key);
export var set = (key, value) => client.hmset(key, value);
