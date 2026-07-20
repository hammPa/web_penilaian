const { v4: uuidv4 } = require('uuid');
const criteriaRepository = require('../repositories/CriteriaRepository');
const tableRepository = require('../repositories/TableRepository');
const variableRepository = require('../repositories/VariableRepository');

class CriteriaService {
  async getAll() {
    return criteriaRepository.findAll();
  }

  async getByTableId(tableId) {
    // pastikan tabel ada
    const table = await tableRepository.findById(tableId);
    if (!table) throw { status: 404, message: 'Tabel tidak ditemukan' };
    return criteriaRepository.findByTableId(tableId);
  }

  async getById(id) {
    const criteria = await criteriaRepository.findById(id);
    if (!criteria) throw { status: 404, message: 'Kriteria tidak ditemukan' };
    return criteria;
  }

  async create(data) {
    if (!data.name || !data.tableId) {
      throw { status: 400, message: 'Nama dan tabel wajib diisi' };
    }
    const table = await tableRepository.findById(data.tableId);
    if (!table) throw { status: 404, message: 'Tabel tidak ditemukan' };

    const newCriteria = {
      id: uuidv4(),
      tableId: data.tableId,
      name: data.name,
      description: data.description || ''
    };
    return criteriaRepository.create(newCriteria);
  }

  async update(id, data) {
    const existing = await this.getById(id);
    if (data.tableId) {
      const table = await tableRepository.findById(data.tableId);
      if (!table) throw { status: 404, message: 'Tabel tidak ditemukan' };
    }
    const updated = {
      tableId: data.tableId || existing.tableId,
      name: data.name || existing.name,
      description: data.description !== undefined ? data.description : existing.description
    };
    return criteriaRepository.update(id, updated);
  }

  async delete(id) {
    await this.getById(id);
    // Hapus juga variabel di bawah kriteria ini (cascade)
    const vars = await variableRepository.findByCriteriaId(id);
    for (const v of vars) {
      await variableRepository.delete(v.id);
    }
    await criteriaRepository.delete(id);
    return { message: 'Kriteria berhasil dihapus' };
  }
}

module.exports = new CriteriaService();