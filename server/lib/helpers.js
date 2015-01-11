let autoCurry = require('auto-curry');

export var promise = (resolve) => (err, value) => {
  if (err) throw err;
  resolve(value);
};

/**
 * Creates a relation between [entity] and [otherEntity] with the label [label]
 * @param entity {Entity}
 * @param label {String}
 * @param otherEntity {Entity}
 * @returns {Relation}
 */
export var relate = autoCurry((entity, label, otherEntity) => ({
  start: entity, end: otherEntity, label: label
}));
