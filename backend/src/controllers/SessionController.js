const sessionService = require('../services/SessionService');
const { success } = require('../utils/responseFormatter');

class SessionController {
  async getAll(req, res, next) {
    try { success(res, sessionService.getAll()); } catch (err) { next(err); }
  }
  async getById(req, res, next) {
    try { success(res, sessionService.getById(req.params.id)); } catch (err) { next(err); }
  }
  async create(req, res, next) {
    try { success(res, sessionService.create(req.body), 'Sesi berhasil dibuat', 201); } catch (err) { next(err); }
  }
  async update(req, res, next) {
    try { success(res, sessionService.update(req.params.id, req.body), 'Sesi berhasil diperbarui'); } catch (err) { next(err); }
  }
  async delete(req, res, next) {
    try { success(res, sessionService.delete(req.params.id), 'Sesi berhasil dihapus'); } catch (err) { next(err); }
  }
  async duplicate(req, res, next) {
    try {
      const data = sessionService.duplicate(req.params.id, req.body);
      success(res, data, 'Sesi berhasil diduplikat', 201);
    } catch (err) { next(err); }
  }
}

module.exports = new SessionController();