const tableService = require('../services/TableService');
const { success } = require('../utils/responseFormatter');

class TableController {
  async getAll(req, res, next) {
    try {
      const { sessionId } = req.query;
      const data = sessionId
        ? tableService.getBySessionId(sessionId)
        : tableService.getAll();
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = tableService.getById(req.params.id);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = tableService.create(req.body);
      success(res, data, 'Tabel berhasil dibuat', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = tableService.update(req.params.id, req.body);
      success(res, data, 'Tabel berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = tableService.delete(req.params.id);
      success(res, result, 'Tabel berhasil dihapus');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new TableController();