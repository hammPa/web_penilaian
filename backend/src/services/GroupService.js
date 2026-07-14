const { v4: uuidv4 } = require('uuid');
const groupRepository = require('../repositories/GroupRepository');
const teamRepository = require('../repositories/TeamRepository');

class GroupService {
  getAll() {
    return groupRepository.findAll() || [];
  }

  getByTeamId(teamId) {
    const team = teamRepository.findById(teamId);
    if (!team) throw { status: 404, message: 'Tim tidak ditemukan' };
    return groupRepository.findByTeamId(teamId);
  }

  getById(id) {
    const group = groupRepository.findById(id);
    if (!group) throw { status: 404, message: 'Grup tidak ditemukan' };
    return group;
  }

  create(data) {
    if (!data.name || !data.gugus) {
      throw { status: 400, message: 'Nama dan Gugus wajib diisi' };
    }
    if (!data.teamId) {
      throw { status: 400, message: 'Tim wajib dipilih' };
    }
    const team = teamRepository.findById(data.teamId);
    if (!team) throw { status: 404, message: 'Tim tidak ditemukan' };

    const newGroup = {
      id: uuidv4(),
      name: data.name,
      gugus: data.gugus,
      teamId: data.teamId
    };
    return groupRepository.create(newGroup);
  }

  update(id, data) {
    const existing = this.getById(id);
    if (data.teamId) {
      const team = teamRepository.findById(data.teamId);
      if (!team) throw { status: 404, message: 'Tim tidak ditemukan' };
    }
    const updated = {
      name: data.name || existing.name,
      gugus: data.gugus || existing.gugus,
      teamId: data.teamId !== undefined ? data.teamId : existing.teamId
    };
    return groupRepository.update(id, updated);
  }

  delete(id) {
    this.getById(id);
    groupRepository.delete(id);
    return { message: 'Grup berhasil dihapus' };
  }
}

module.exports = new GroupService();