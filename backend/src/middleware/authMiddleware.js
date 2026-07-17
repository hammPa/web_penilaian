const authService = require('../services/AuthService');
const UserRepository = require('../repositories/UserRepository');
const { error } = require('../utils/responseFormatter');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 'Token tidak ditemukan', 401);
  }
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = authService.verifyToken(token);

    // Validasi Single Active Session ---
    const user = UserRepository.findById(decoded.id);
    if (!user || user.activeToken !== token) {
      return error(res, 'Sesi berakhir karena akun ini telah login di perangkat lain.', 401);
    }

    req.user = decoded; // { id, username, role }
    next();
  } catch (err) {
    return error(res, 'Token tidak valid', 401);
  }
};