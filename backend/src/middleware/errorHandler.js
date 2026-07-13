const { error } = require('../utils/responseFormatter');

module.exports = (err, req, res, next) => {
  console.error(err.stack);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  error(res, message, status);
};