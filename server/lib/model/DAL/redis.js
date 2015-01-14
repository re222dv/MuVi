export var redis = require('then-redis');

export var client = redis.createClient();

/**
 * @param {String} key to delete
 * @returns {Promise}
 */
export var del = (key) => client.del(key);
/**
 * @param {String} key to get
 * @returns {Promise}
 */
export var get = (key) => client.get(key).then(JSON.parse);
/**
 * @param {String} key to set
 * @param value to set
 * @returns {Promise}
 */
export var set = (key, value) => client.set(key, JSON.stringify(value));
/**
 * @param {String} key to atomically get and set
 * @param value to set
 * @returns {Promise}
 */
export var getset = (key, value) => client.send('getset', [key, JSON.stringify(value)])
  .then(JSON.parse);
/**
 * @param {String} key to expire
 * @param {integer} seconds Time in second for the key to live
 * @returns {Promise}
 */
export var expire = (key, seconds) => client.send('expire', [key, seconds]);
/**
 * @param {String} channel to publish to
 * @param value to publish
 * @returns {Promise}
 */
export var pub = (channel, value) => client.publish(channel, value);
/**
 * @param {String} channel to subscribe to
 * @returns {Promise<redis.Client>}
 */
export var sub = (channel) => {
  let subscriber = redis.createClient();
  return subscriber.subscribe(channel)
    .then(() => subscriber);
};
