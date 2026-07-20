const variableService = require('../services/VariableService');
const { success } = require('../utils/responseFormatter');

class VariableController {
  async getAll(req, res, next) {
    try {
      const { criteriaId } = req.query;
      const data = criteriaId
        ? await variableService.getByCriteriaId(criteriaId)
        : await variableService.getAll();
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = await variableService.getById(req.params.id);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = await variableService.create(req.body);
      success(res, data, 'Variabel berhasil dibuat', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = await variableService.update(req.params.id, req.body);
      success(res, data, 'Variabel berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = await variableService.delete(req.params.id);
      success(res, result, 'Variabel berhasil dihapus');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VariableController();