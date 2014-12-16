export var redis = require('then-redis');

export var client = redis.createClient();

export var del = (key) => client.del(key);
export var get = (key) => client.get(key).then(JSON.parse);
export var set = (key, value) => client.set(key, JSON.stringify(value));