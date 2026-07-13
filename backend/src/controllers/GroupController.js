const groupService = require('../services/GroupService');
const { success } = require('../utils/responseFormatter');

class GroupController {
  async getAll(req, res, next) {
    try { success(res, await groupService.getAll()); } catch (err) { next(err); }
  }
  async getById(req, res, next) {
    try { success(res, await groupService.getById(req.params.id)); } catch (err) { next(err); }
  }
  async create(req, res, next) {
    try { success(res, await groupService.create(req.body), 'Grup dibuat', 201); } catch (err) { next(err); }
  }
  async update(req, res, next) {
    try { success(res, await groupService.update(req.params.id, req.body), 'Grup diupdate'); } catch (err) { next(err); }
  }
  async delete(req, res, next) {
    try { success(res, await groupService.delete(req.params.id), 'Grup dihapus'); } catch (err) { next(err); }
  }
}

module.exports = new GroupController();