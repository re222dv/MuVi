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
  label: Joi.string().alphanum().min(1).required(),
});

let validate = (entity) =>
  new Promise(resolve => {
    if (schemas[entity.type] === undefined) throw 'Not a valid type';

    Joi.validate(entity, schemas[entity.type], promise(resolve));
  });

let validateRelation = (relation) =>
  new Promise(resolve =>
    Joi.validate(relation, relationSchema, promise(resolve)));

let nodeFor = (entity) =>
  entity.index !== undefined ?
      `(n${entity.index})`
    : `({id: "${entity.id}"})`;

let neo4j = {
  create: (entities, relations) =>
    Promise.all(entities.map(validate))
      .then(() => entities.map(entity => entity.id = uuid.v1()))
      .then(() => Promise.all(relations.map(validateRelation)))
      .then(() => {
        let query = 'Create ';
        let placeholders = {};
        entities.forEach((entity, index) => {
          entity.index = index;
          query += `(n${index}:${entity.type} {n${index}}), `;
          placeholders[`n${index}`] = entity;
        });
        relations.forEach(relation => {
          query += `${nodeFor(relation.start)}-[:${relation.label}]->${nodeFor(relation.end)}, `;
        });
        entities.forEach(entity => {
          delete entity.index;
        });
        query = query.substr(0, query.length - 2);

        return new Promise(resolve =>
          db.query(query, placeholders, promise(resolve)));
      }),

  getUsersPlaylists: (userId) =>
    new Promise(resolve =>
      db.query('Match (:User {id:{userId}})-[]->(p:Playlist) Return p', {userId}, promise(resolve)))
      .then(result => result.map(row => row.p._data.data)),

  getPlaylist: (id) =>
    new Promise(resolve =>
      db.query(`Match (p:Playlist {id:{id}}),
                      (p)-[]->(s:Song)-[]->(al:Album)-[]->(ar:Artist)
                Optional Match (s)-[]->(v:Video)
                Return s,al,ar,v`, {id}, promise(resolve)))
      .then(result => {
        let playlist = {id, songs: []};
        result.forEach(row => {
          row.s._data.data.album = row.al._data.data;
          row.s._data.data.artist = row.ar._data.data;
          if (row.v) {
            row.s._data.data.video = row.v._data.data;
          }
          playlist.songs.push(row.s._data.data);
        });
        return playlist;
      }),
};

export default neo4j;
