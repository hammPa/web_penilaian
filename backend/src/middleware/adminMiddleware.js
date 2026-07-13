const { error } = require('../utils/responseFormatter');

module.exports = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return error(res, 'Hanya admin yang dapat mengakses', 403);
  }
  next();
};