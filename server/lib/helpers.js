export var promise = (resolve) => (err, value) => {
  if (err) throw err;
  resolve(value);
};
