const teamService = require('../services/TeamService');
const { success } = require('../utils/responseFormatter');

class TeamController {
  async getAll(req, res, next) {
    try { success(res, await teamService.getAll()); } catch (err) { next(err); }
  }
  async getById(req, res, next) {
    try { success(res, await teamService.getById(req.params.id)); } catch (err) { next(err); }
  }
  async create(req, res, next) {
    try { success(res, await teamService.create(req.body), 'Tim dibuat', 201); } catch (err) { next(err); }
  }
  async update(req, res, next) {
    try { success(res, await teamService.update(req.params.id, req.body), 'Tim diupdate'); } catch (err) { next(err); }
  }
  async delete(req, res, next) {
    try { success(res, await teamService.delete(req.params.id), 'Tim dihapus'); } catch (err) { next(err); }
  }
}

module.exports = new TeamController();