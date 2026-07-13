const authService = require('../services/AuthService');
const { error } = require('../utils/responseFormatter');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Token tidak ditemukan', 401);
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    return error(res, 'Token tidak valid', 401);
  }
};