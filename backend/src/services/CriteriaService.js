const { v4: uuidv4 } = require('uuid');
const criteriaRepository = require('../repositories/CriteriaRepository');
const tableRepository = require('../repositories/TableRepository');
const variableRepository = require('../repositories/VariableRepository');

class CriteriaService {
  getAll() {
    return criteriaRepository.findAll();
  }

  getByTableId(tableId) {
    // pastikan tabel ada
    const table = tableRepository.findById(tableId);
    if (!table) throw { status: 404, message: 'Tabel tidak ditemukan' };
    return criteriaRepository.findByTableId(tableId);
  }

  getById(id) {
    const criteria = criteriaRepository.findById(id);
    if (!criteria) throw { status: 404, message: 'Kriteria tidak ditemukan' };
    return criteria;
  }

  create(data) {
    if (!data.name || !data.tableId) {
      throw { status: 400, message: 'Nama dan tabel wajib diisi' };
    }
    const table = tableRepository.findById(data.tableId);
    if (!table) throw { status: 404, message: 'Tabel tidak ditemukan' };

    const newCriteria = {
      id: uuidv4(),
      tableId: data.tableId,
      name: data.name,
      description: data.description || ''
    };
    return criteriaRepository.create(newCriteria);
  }

  update(id, data) {
    const existing = this.getById(id);
    if (data.tableId) {
      const table = tableRepository.findById(data.tableId);
      if (!table) throw { status: 404, message: 'Tabel tidak ditemukan' };
    }
    const updated = {
      tableId: data.tableId || existing.tableId,
      name: data.name || existing.name,
      description: data.description !== undefined ? data.description : existing.description
    };
    return criteriaRepository.update(id, updated);
  }

  delete(id) {
    this.getById(id);
    // Hapus juga variabel di bawah kriteria ini (cascade)
    variableRepository.findByCriteriaId(id).forEach(v => variableRepository.delete(v.id));
    criteriaRepository.delete(id);
    return { message: 'Kriteria berhasil dihapus' };
  }
}

module.exports = new CriteriaService();