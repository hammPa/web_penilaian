const { v4: uuidv4 } = require('uuid');
const teamRepository = require('../repositories/TeamRepository');

class TeamService {
  getAll() {
    return teamRepository.findAll();
  }
  getById(id) {
    const team = teamRepository.findById(id);
    if (!team) throw { status: 404, message: 'Tim tidak ditemukan' };
    return team;
  }
  create(data) {
    if (!data.name) throw { status: 400, message: 'Nama tim wajib diisi' };
    const newTeam = {
      id: uuidv4(),
      name: data.name,
      // Pastikan berupa array, jika tidak berikan array kosong
      groupIds: Array.isArray(data.groupIds) ? data.groupIds : [] 
    };
    return teamRepository.create(newTeam);
  }
  update(id, data) {
    const existing = this.getById(id);
    const updated = {
      name: data.name || existing.name,
      // Update array groupIds
      groupIds: data.groupIds !== undefined ? data.groupIds : (existing.groupIds || [])
    };
    return teamRepository.update(id, updated);
  }
  delete(id) {
    this.getById(id);
    teamRepository.delete(id);
    return { message: 'Tim berhasil dihapus' };
  }
}

module.exports = new TeamService();