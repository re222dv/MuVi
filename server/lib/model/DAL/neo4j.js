let db = new (require('neo4j').GraphDatabase)('http://localhost:7474');
let Joi = require('joi');
let uuid = require('node-uuid');

import {promise} from '../../helpers';
import schemas from '../schemas';

let writeQueue = [];

/**
 * Performs the first query in the queue
 */
let performWrite = () => {
  console.log('In queue', writeQueue.length);
  if (writeQueue.length) {
    let job = writeQueue[0];
    return job()
      .then(_ => {
        writeQueue.shift();
        performWrite();
        return _;
      });
  }
};

/**
 * Queues the query avoid locks in neo4j
 */
let queueWrite = (query, placeholders) =>
  new Promise(resolveWrite => {
    writeQueue.push(() =>
      new Promise(resolveQuery => db.query(query, placeholders, promise(resolveQuery)))
        .then(resolveWrite));
    if (writeQueue.length === 1) {
      performWrite();
    }
  });

let relationSchema = Joi.object().keys({
  start: Joi.object().keys({
    id: Joi.string().guid().required()
  }).unknown().required(),
  end: Joi.object().keys({
    id: Joi.string().guid().required()
  }).unknown().required(),
  label: Joi.string().alphanum().min(1).optional(),
});

/**
 * Validates an entity
 *
 * @param {Entity} entity
 * @returns {Promise} resolved on success, rejected on failure
 */
let validate = (entity) =>
  new Promise(resolve => {
    if (schemas[entity.type] === undefined) throw 'Not a valid type';

    Joi.validate(entity, schemas[entity.type], promise(resolve));
  });

/**
 * Validates relation
 *
 * @param {Relation} relation
 * @returns {Promise} resolved on success, rejected on failure
 */
let validateRelation = (relation) =>
  new Promise(resolve =>
    Joi.validate(relation, relationSchema, promise(resolve)));

let neo4j = {
  /**
   * @param {String} query Cypher query
   * @param {object} parameters Query parameters
   * @returns {Promise<Array>}
   */
  query: (query, parameters) =>
    new Promise(resolve =>
      db.query(query, parameters, promise(resolve)))
      .then(result => result.map(row => {
        Object.keys(row).forEach(key => {
          // Suppress error if field is not a node value
          try {
            row[key] = row[key]._data.data;
          } catch (_) {}
        });
        return row;
      })),

  /**
   * @param {Array.<Entity>} entities Entities to match or insert
   * @param {Array.<Relation>} relations Relations to assert
   * @returns {Promise}
   */
  create: (entities, relations) =>
    Promise.all(entities.map(validate))
      .then(() => entities.map(entity => entity.id ? entity.old = true : entity.id = uuid.v1()))
      .then(() => Promise.all(relations.map(validateRelation)))
      .then(() => {
        let match = 'Match ';
        let create = 'Create ';
        let merge = '';
        let mergeLast = '';
        let createUnique = 'Create Unique ';
        let placeholders = {};
        entities.forEach((entity, index) => {
          placeholders[`n${index}`] = JSON.parse(JSON.stringify(entity));
          entity.index = index;

          if (!entity.old && schemas[entity.type].unique) {
            let id = schemas[entity.type].unique;
            merge += `Merge (n${entity.index}:${entity.type} {${id}: {n${entity.index}}.${id}}) ` +
            `On Create Set n${entity.index}.id = {n${entity.index}}.newId ` +
            `Set n${entity.index} += {n${entity.index}} `;
            placeholders[`n${entity.index}`].newId = placeholders[`n${entity.index}`].id;
            delete placeholders[`n${entity.index}`].id;
          }
        });
        relations.forEach(relation => {
          relation.label = relation.label || 'Relates';
          if (!relation.end.old && schemas[relation.end.type].isIdentifier) {
            relation.start.identifier = relation.end;
            let startIndex = relation.start.index;
            merge += `Merge (n${startIndex}:${relation.start.type})-` +
                        `[:${relation.label}]->(n${relation.end.index}) ` +
                     `On Create Set n${startIndex}.id = {n${startIndex}}.newId ` +
                     `Set n${startIndex} += {n${relation.start.index}} `;
            placeholders[`n${startIndex}`].newId = placeholders[`n${startIndex}`].id;
            delete placeholders[`n${startIndex}`].id;
          } else {
            //createUnique += `(n${relation.start.index})-[:${relation.label}]` +
            //                  `->(n${relation.end.index}), `;
            mergeLast += `Merge (n${relation.start.index})-[:${relation.label}]` +
            `->(n${relation.end.index}) `;
          }
        });
        entities.forEach(entity => {
          if (entity.old) {
            match += `(n${entity.index}:${entity.type} {id: {n${entity.index}}.id}), `;
          } else if (!entity.identifier && !schemas[entity.type].unique) {
            //create += `(n${entity.index}:${entity.type} {n${entity.index}}), `;
            merge += `Merge (n${entity.index}:${entity.type} {id: {n${entity.index}}.id}) ` +
            `Set n${entity.index} += {n${entity.index}} `;
          }
          delete entity.old;
          delete entity.identifier;
          delete entity.index;
        });
        match = match.substr(0, match.length - 2);
        create = create.substr(0, create.length - 2);
        createUnique = createUnique.substr(0, createUnique.length - 2);

        if (match.length < 6) {
          match = '';
        }
        if (create.length < 7) {
          create = '';
        }
        if (createUnique.length < 14) {
          createUnique = '';
        }

        console.log(`${match} ${create} ${merge} ${createUnique} ${mergeLast}`);

        if (!create && !merge && !createUnique && !mergeLast) {
          return Promise.resolve([]);
        }

        return queueWrite(`${match} ${create} ${merge} ${createUnique} ${mergeLast}`, placeholders);
      }),

  /**
   * @param {Array.<Entity>} entities Entities to update
   * @returns {Promise}
   */
  save: (entities) =>
    Promise.all(entities.map(validate))
      .then(() => {
        let query = 'Match ';
        let placeholders = {};
        entities.forEach((entity, index) => {
          query += `(n${index}:${entity.type} {id: {n${index}}.id}), `;
        });
        query = query.substr(0, query.length - 2);

        query += ' Set ';
        entities.forEach((entity, index) => {
          query += `n${index} = {n${index}}, `;
          placeholders[`n${index}`] = entity;
        });
        query = query.substr(0, query.length - 2);

        console.log(query);

        return queueWrite(query, placeholders);
      }),

  /**
   * Get a users playlists
   *
   * @param {String} userId
   * @returns {Promise}
   */
  getUserPlaylists: (userId) =>
    new Promise(resolve =>
      db.query(`Match (:User {id:{userId}})-->(p:Playlist)-->(:Song)-->(:YouTubeVideo)
                Return DISTINCT p`, {userId}, promise(resolve)))
      .then(result => result.map(row => row.p._data.data)),

  /**
   * Get a playlist
   *
   * @param {String} userId A user related to the playlists
   * @param {String} playlistId
   * @returns {Promise}
   */
  getPlaylist: (userId, playlistId) =>
    new Promise(resolve =>
      db.query(`Match (:User {id:{userId}})-->(p:Playlist {id:{playlistId}}),
                      (p)-->(s:Song)-->(al:Album),
                      (v:YouTubeVideo)<--(s)-->(ar:Artist)
                Return s,p,
                       head(collect(al)) as al,
                       head(collect(ar)) as ar,
                       head(collect(v)) as v`, {userId, playlistId}, promise(resolve)))
      .then(result => {
        if (!result.length) {
          return null;
        }

        let playlist = result[0].p._data.data;
        playlist.songs = [];
        result.forEach(row => {
          row.s._data.data.album = row.al._data.data;
          row.s._data.data.artist = row.ar._data.data;
          row.s._data.data.video = row.v._data.data;
          playlist.songs.push(row.s._data.data);
        });
        return playlist;
      }),
};

export default neo4j;
