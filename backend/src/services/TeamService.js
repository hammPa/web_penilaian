const { v4: uuidv4 } = require('uuid');
const teamRepository = require('../repositories/TeamRepository');
const groupRepository = require('../repositories/GroupRepository');

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
      name: data.name
    };
    return teamRepository.create(newTeam);
  }
  update(id, data) {
    const existing = this.getById(id);
    const updated = {
      name: data.name || existing.name
    };
    return teamRepository.update(id, updated);
  }
  delete(id) {
    this.getById(id);
    // Cascade: lepaskan (unassign) semua grup yang masih terhubung ke tim ini,
    // bukan ikut terhapus -- grup tetap ada, cuma jadi tidak bertim.
    const relatedGroups = groupRepository.findByTeamId(id);
    relatedGroups.forEach(g => groupRepository.update(g.id, { teamId: null }));

    teamRepository.delete(id);
    return { message: 'Tim berhasil dihapus' };
  }
}

module.exports = new TeamService();