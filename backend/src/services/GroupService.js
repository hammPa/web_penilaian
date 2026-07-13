const { v4: uuidv4 } = require('uuid');
const groupRepository = require('../repositories/GroupRepository');

class GroupService {
  getAll() {
    return groupRepository.findAll() || [];
  }
  getById(id) {
    const group = groupRepository.findById(id);
    if (!group) throw { status: 404, message: 'Grup tidak ditemukan' };
    return group;
  }
  create(data) {
    if (!data.name || !data.gugus) throw { status: 400, message: 'Nama dan Gugus wajib diisi' };
    const newGroup = {
      id: uuidv4(),
      name: data.name,
      gugus: data.gugus
    };
    return groupRepository.create(newGroup);
  }
  update(id, data) {
    const existing = this.getById(id);
    const updated = {
      name: data.name || existing.name,
      gugus: data.gugus || existing.gugus
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