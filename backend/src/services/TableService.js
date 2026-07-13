const { v4: uuidv4 } = require('uuid');
const tableRepository = require('../repositories/TableRepository');
const criteriaRepository = require('../repositories/CriteriaRepository');
const variableRepository = require('../repositories/VariableRepository');

class TableService {
  getAll() {
    return tableRepository.findAll();
  }

  getById(id) {
    const table = tableRepository.findById(id);
    if (!table) throw { status: 404, message: 'Tabel tidak ditemukan' };
    return table;
  }

  create(data) {
    if (!data.name) {
      throw { status: 400, message: 'Nama tabel wajib diisi' };
    }
    const newTable = {
      id: uuidv4(),
      name: data.name,
      description: data.description || ''
    };
    return tableRepository.create(newTable);
  }

  update(id, data) {
    const existing = this.getById(id);
    const updated = {
      name: data.name || existing.name,
      description: data.description !== undefined ? data.description : existing.description
    };
    return tableRepository.update(id, updated);
  }

  delete(id) {
    this.getById(id);
    // Hapus juga kriteria & variabel di bawah tabel ini (cascade)
    const criteriaList = criteriaRepository.findByTableId(id);
    criteriaList.forEach(c => {
      variableRepository.findByCriteriaId(c.id).forEach(v => variableRepository.delete(v.id));
      criteriaRepository.delete(c.id);
    });
    tableRepository.delete(id);
    return { message: 'Tabel berhasil dihapus' };
  }
}

module.exports = new TableService();