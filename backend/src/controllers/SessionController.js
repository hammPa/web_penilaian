const sessionService = require('../services/SessionService');
const { success } = require('../utils/responseFormatter');

class SessionController {
  async getAll(req, res, next) {
    try { success(res, await sessionService.getAll()); } catch (err) { next(err); }
  }
  async getById(req, res, next) {
    try { success(res, await sessionService.getById(req.params.id)); } catch (err) { next(err); }
  }
  async create(req, res, next) {
    try { success(res, await sessionService.create(req.body), 'Sesi berhasil dibuat', 201); } catch (err) { next(err); }
  }
  async update(req, res, next) {
    try { success(res, await sessionService.update(req.params.id, req.body), 'Sesi berhasil diperbarui'); } catch (err) { next(err); }
  }
  async delete(req, res, next) {
    try { success(res, await sessionService.delete(req.params.id), 'Sesi berhasil dihapus'); } catch (err) { next(err); }
  }
  async duplicate(req, res, next) {
    try {
      const data = await sessionService.duplicate(req.params.id, req.body);
      success(res, data, 'Sesi berhasil diduplikat', 201);
    } catch (err) { next(err); }
  }
}

module.exports = new SessionController();