export var redis = require('then-redis');

export var client = redis.createClient();

export var del = (key) => client.del(key);
export var get = (key) => client.get(key).then(JSON.parse);
export var set = (key, value) => client.set(key, JSON.stringify(value));
export var pub = (channel, value) => client.publish(channel, JSON.stringify(value));
export var sub = (channel) => {
  let subscriber = redis.createClient();
  return subscriber.subscribe(channel)
    .then(() => subscriber);
};
export var expire = (key, seconds) => client.send('expire', [key, seconds]);
