let db = new (require('neo4j').GraphDatabase)('http://localhost:7474');
let Joi = require('joi');
let uuid = require('node-uuid');

import {promise} from '../../helpers';
import schemas from '../schemas';

let relationSchema = Joi.object().keys({
  start: Joi.object().keys({
    id: Joi.string().guid().required()
  }).unknown().required(),
  end: Joi.object().keys({
    id: Joi.string().guid().required()
  }).unknown().required(),
  label: Joi.string().alphanum().min(1).optional(),
});

let validate = (entity) =>
  new Promise(resolve => {
    if (schemas[entity.type] === undefined) throw 'Not a valid type';

    Joi.validate(entity, schemas[entity.type], promise(resolve));
  });

let validateRelation = (relation) =>
  new Promise(resolve =>
    Joi.validate(relation, relationSchema, promise(resolve)));

let neo4j = {
  query: (query, parameters) =>
    new Promise(resolve =>
      db.query(query, parameters, promise(resolve)))
      .then(result => result.map(row => {
        Object.keys(row).forEach(key => row[key] = row[key]._data.data);
        return row;
      })),

  create: (entities, relations) =>
    Promise.all(entities.map(validate))
      .then(() => entities.map(entity => entity.id ? entity.old = true : entity.id = uuid.v1()))
      .then(() => Promise.all(relations.map(validateRelation)))
      .then(() => {
        let match = 'Match ';
        let create = 'Create ';
        let createUnique = 'Create Unique ';
        let placeholders = {};
        entities.forEach((entity, index) => {
          entity.index = index;
          if (entity.old) {
            match += `(n${index}:${entity.type} {id: {n${index}}.id}), `;
          } else {
            create += `(n${index}:${entity.type} {n${index}}), `;
          }
          placeholders[`n${index}`] = entity;
        });
        relations.forEach(relation => {
          createUnique += `(n${relation.start.index})-[:${relation.label || 'Relates'}]` +
                          `->(n${relation.end.index}), `;
        });
        entities.forEach(entity => {
          delete entity.old;
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

        console.log(`${match} ${create} ${createUnique}`);

        if (!create && !createUnique) {
          return Promise.resolve([]);
        }

        return new Promise(resolve =>
          db.query(`${match} ${create} ${createUnique}`, placeholders, promise(resolve)));
      }),

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

        return new Promise(resolve =>
          db.query(query, placeholders, promise(resolve)));
      }),


  getEntities: (type, key, value) => {
    let where = '';

    if (key && value instanceof Array) {
      where = `WHERE n.${key} IN {value}`;
    } else if (key) {
      where = `WHERE n.${key} = {value}`;
    }

    return new Promise(resolve =>
      db.query(`Match (n:${type}) ${where} Return n`, {value}, promise(resolve)))
      .then(result => result.map(row => row.n._data.data));
  },

  getUserPlaylists: (userId) =>
    new Promise(resolve =>
      db.query(`Match (:User {id:{userId}})-->(p:Playlist)-->(:Song)-->(:YouTubeVideo)
                Return DISTINCT p`, {userId}, promise(resolve)))
      .then(result => result.map(row => row.p._data.data)),

  getPlaylist: (id) =>
    new Promise(resolve =>
      db.query(`Match (p:Playlist {id:{id}})-->(s:Song)-->(al:Album),
                      (v:YouTubeVideo)<--(s)-->(ar:Artist)
                Return s,al,ar,v,p`, {id}, promise(resolve)))
      .then(result => {
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
