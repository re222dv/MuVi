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
        query = query.substr(0, query.length - 2);

        return new Promise(resolve =>
          db.query(query, placeholders, promise(resolve)));
      }
  ),
  getUsersPlaylists: (userId) =>
    db.query('Match (:User {id:{userId}})-[]->(p:Playlist) Return p', {userId})
      .then(result => console.log(result)),
  getPlaylist: (playlistId) =>
    db.query(`Match (p:Playlist {id:{playlistId}})
                    (p)-[]->(s:Song)-[]->(al:Album)-[]->(ar:Artist)
                    (s)-[]->(v:Video)
              Return s,al,ar`, {playlistId})
      .then(result => console.log(result)),
};

export default neo4j;
