let Rx = require('rx');
import {getArtist} from '../model/DAL/freebase.js';
import neo4j from '../model/DAL/neo4j.js';
import {relate} from '../helpers.js';
let redis = require('../model/DAL/redis');

const ONE_HOUR = 1000 * 60 * 60;

/**
 * Tries to get missing FreebaseEntities
 * @Returns {Promise}
 */
export var getMissingFreebaseEntities = () =>
  neo4j.query(`Match (artist:Artist)
               Where not (:FreebaseEntity)<--(artist)
               Return artist.id as id, artist.name as name`)
    .then(rows => new Promise((resolve, reject) => {
      let subject = new Rx.Subject();

      subject
        // Lock in redis to not download the same entity multiple times
        .flatMap(chunk => Promise.all(
          chunk.map(artist => redis.getset(`freebase-${artist.id}`, true)
            .then(_ => {
              redis.expire(`freebase-${artist.id}`, ONE_HOUR);
              return _;
            })
            .then(busy => busy ? undefined : artist))))
        .map(chunk => chunk.filter(artist => artist !== undefined))
        .flatMap(chunk => Promise.all(
          chunk.map(artist => getArtist(artist.name)
            .then(relate({id: artist.id, type: 'Artist'}, 'is')))))
        .flatMap(relations => {
          let data = {
            entities: [],
            relations: relations.filter(relation => relation.end !== undefined),
          };
          data.relations
            .forEach(relation => {
              data.entities.push(relation.start);
              data.entities.push(relation.end);
            });

          return neo4j.create(data.entities, data.relations);
        })
        .doOnError((e) => console.error('Freebase Error', e))
        .doOnCompleted(() => console.log('Freebase done'))
        .subscribe(() => {}, reject, resolve);

      // Chunk the rows with a window so we don't send to many requests at the same time
      let pushChunk;
      pushChunk = () => {
        if (rows.length) {
          subject.onNext(rows.splice(0, 50));
          setTimeout(pushChunk, 50);
        } else {
          subject.onCompleted();
          subject.dispose();
        }
      };
      pushChunk();
    }));
