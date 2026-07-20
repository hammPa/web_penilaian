const { v4: uuidv4 } = require('uuid');
const teamRepository = require('../repositories/TeamRepository');
const groupRepository = require('../repositories/GroupRepository');

class TeamService {
  async getAll() {
    return teamRepository.findAll();
  }
  async getById(id) {
    const team = await teamRepository.findById(id);
    if (!team) throw { status: 404, message: 'Tim tidak ditemukan' };
    return team;
  }
  async create(data) {
    if (!data.name) throw { status: 400, message: 'Nama tim wajib diisi' };
    const newTeam = {
      id: uuidv4(),
      name: data.name
    };
    return teamRepository.create(newTeam);
  }
  async update(id, data) {
    const existing = await this.getById(id);
    const updated = {
      name: data.name || existing.name
    };
    return teamRepository.update(id, updated);
  }
  async delete(id) {
    await this.getById(id);
    // Cascade: lepaskan (unassign) semua grup yang masih terhubung ke tim ini,
    // bukan ikut terhapus -- grup tetap ada, cuma jadi tidak bertim.
    const relatedGroups = await groupRepository.findByTeamId(id);
    for (const g of relatedGroups) {
      await groupRepository.update(g.id, { teamId: null });
    }

    await teamRepository.delete(id);
    return { message: 'Tim berhasil dihapus' };
  }
}

module.exports = new TeamService();