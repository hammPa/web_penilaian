const assessmentService = require('../services/AssessmentService');
const { success } = require('../utils/responseFormatter');

class AssessmentController {
  async create(req, res, next) {
    try {
      const { groupId, sessionId, selections, photos } = req.body;
      // selections: [{ variableId, selectedLevel }]
      const assessment = await assessmentService.create(req.user.id, groupId, sessionId, selections, photos);
      success(res, assessment, 'Penilaian berhasil disimpan', 201);
    } catch (err) {
      next(err);
    }
  }

  async getAll(req, res, next) {
    try {
      const data = assessmentService.getAll(req.user.id, req.user.role);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getById(req, res, next) {
    try {
      const data = assessmentService.getById(req.params.id, req.user.id, req.user.role);
      success(res, data);
    } catch (err) {
      next(err);
    }
  }

  async update(req, res, next) {
    try {
      const { selections, photos } = req.body;
      const assessment = await assessmentService.update(
        req.params.id,
        req.user.id,
        req.user.role,
        { selections, photos }
      );
      success(res, assessment, 'Penilaian berhasil diperbarui');
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AssessmentController();