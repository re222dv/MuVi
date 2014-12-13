let Joi = require('joi');

let base = Joi.object().keys({
  id: Joi.string().guid().optional(),
  type: Joi.string().alphanum().min(1).required(),
});

let schemas = {
  Song: base.keys({
    name: Joi.string(),
    durationMs: Joi.number().integer(),
    number: Joi.number().integer(),
    popularity: Joi.number().integer(),
  }),
  Album: base.keys({
    name: Joi.string(),
    year: Joi.number().integer(),
    popularity: Joi.number().integer(),
  }),
  Artist: base.keys({
    name: Joi.string(),
    popularity: Joi.number().integer(),
  }),
  Genre: base.keys({
    name: Joi.string(),
    popularity: Joi.number().integer(),
  }),
  Playlist: base.keys({
    name: Joi.string(),
  }),
  Image: base.keys({
    url: Joi.string(),
    width: Joi.number().integer(),
    height: Joi.number().integer(),
  }),
  Video: base.keys({
    service: Joi.string(),
    data: Joi.object(),
  }),
  User: base.keys({
    name: Joi.string(),
  }),
  SpotifyEntity: base.keys({
    spotifyId: Joi.string(),
    spotifyType: Joi.string(),
  }),
};

export default schemas;
