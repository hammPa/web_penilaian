const authService = require('../services/AuthService');
const { success, error } = require('../utils/responseFormatter');

class AuthController {
  async login(req, res, next) {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return error(res, 'Username dan password wajib diisi', 400);
      }
      const result = await authService.login(username, password);
      success(res, result, 'Login berhasil');
    } catch (err) {
      next(err);
    }
  }

  async me(req, res, next) {
    try {
      // req.user sudah diisi authMiddleware dari token: { id, username, role, ... }
      const user = await authService.getUserById(req.user.id);
      if (!user) {
        return error(res, 'User tidak ditemukan', 404);
      }
      success(res, { user }, 'OK');
    } catch (err) {
      next(err);
    }
  }

  async logout(req, res, next) {
    try {
      // Hapus activeToken dari database
      const userRepository = require('../repositories/UserRepository');
      userRepository.update(req.user.id, { activeToken: null });
      
      success(res, null, 'Logout berhasil');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AuthController();