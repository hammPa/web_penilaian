const userService = require('../services/UserService');
const { success } = require('../utils/responseFormatter');

class UserController {
  async getAll(req, res, next) {
    try {
      const data = await userService.getAll();
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await userService.getById(req.params.id);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await userService.create(req.body);
      success(res, data, 'User berhasil dibuat', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await userService.update(req.params.id, req.body);
      success(res, data, 'User berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  async resetPassword(req, res, next) {
    try {
      const { newPassword } = req.body;
      // req.user diisi authMiddleware dari token -> id admin yang sedang login
      const data = await userService.resetPassword(req.params.id, newPassword, req.user.id);
      success(res, data, 'Password berhasil direset');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await userService.delete(req.params.id);
      success(res, result, 'User berhasil dihapus');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UserController();