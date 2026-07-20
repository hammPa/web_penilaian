const criteriaService = require('../services/CriteriaService');
const { success } = require('../utils/responseFormatter');

class CriteriaController {
  async getAll(req, res, next) {
    try {
      const { tableId } = req.query;
      const data = tableId
        ? await criteriaService.getByTableId(tableId)
        : await criteriaService.getAll();
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await criteriaService.getById(req.params.id);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await criteriaService.create(req.body);
      success(res, data, 'Kriteria berhasil dibuat', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await criteriaService.update(req.params.id, req.body);
      success(res, data, 'Kriteria berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await criteriaService.delete(req.params.id);
      success(res, result, 'Kriteria berhasil dihapus');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new CriteriaController();