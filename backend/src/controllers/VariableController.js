const variableService = require('../services/VariableService');
const { success } = require('../utils/responseFormatter');

class VariableController {
  async getAll(req, res, next) {
    try {
      const { criteriaId } = req.query;
      const data = criteriaId 
        ? variableService.getByCriteriaId(criteriaId)
        : variableService.getAll();
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = variableService.getById(req.params.id);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async create(req, res, next) {
    try {
      const data = variableService.create(req.body);
      success(res, data, 'Variabel berhasil dibuat', 201);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const data = variableService.update(req.params.id, req.body);
      success(res, data, 'Variabel berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }

  async delete(req, res, next) {
    try {
      const result = variableService.delete(req.params.id);
      success(res, result, 'Variabel berhasil dihapus');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new VariableController();