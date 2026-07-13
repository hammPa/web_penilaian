const { v4: uuidv4 } = require('uuid');
const criteriaRepository = require('../repositories/CriteriaRepository');

class CriteriaService {
  getAll() {
    return criteriaRepository.findAll();
  }

  getById(id) {
    const criteria = criteriaRepository.findById(id);
    if (!criteria) throw { status: 404, message: 'Kriteria tidak ditemukan' };
    return criteria;
  }

  create(data) {
    if (!data.name) {
      throw { status: 400, message: 'Nama wajib diisi' };
    }
    const newCriteria = {
      id: uuidv4(),
      name: data.name,
      description: data.description || ''
    };
    return criteriaRepository.create(newCriteria);
  }

  update(id, data) {
    const existing = this.getById(id);
    const updated = {
      name: data.name || existing.name,
      description: data.description !== undefined ? data.description : existing.description
    };
    return criteriaRepository.update(id, updated);
  }

  delete(id) {
    this.getById(id);
    criteriaRepository.delete(id);
    return { message: 'Kriteria berhasil dihapus' };
  }
}

module.exports = new CriteriaService();