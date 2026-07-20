const { v4: uuidv4 } = require('uuid');
const tableRepository = require('../repositories/TableRepository');
const criteriaRepository = require('../repositories/CriteriaRepository');
const variableRepository = require('../repositories/VariableRepository');
const sessionRepository = require('../repositories/SessionRepository');

class TableService {
  async getAll() {
    return tableRepository.findAll();
  }

  async getBySessionId(sessionId) {
    const session = await sessionRepository.findById(sessionId);
    if (!session) throw { status: 404, message: 'Sesi tidak ditemukan' };
    return tableRepository.findBySessionId(sessionId);
  }

  async getById(id) {
    const table = await tableRepository.findById(id);
    if (!table) throw { status: 404, message: 'Tabel tidak ditemukan' };
    return table;
  }

  async create(data) {
    if (!data.name) {
      throw { status: 400, message: 'Nama tabel wajib diisi' };
    }
    if (!data.sessionId) {
      throw { status: 400, message: 'Sesi wajib dipilih' };
    }
    const session = await sessionRepository.findById(data.sessionId);
    if (!session) throw { status: 404, message: 'Sesi tidak ditemukan' };

    const newTable = {
      id: uuidv4(),
      name: data.name,
      description: data.description || '',
      sessionId: data.sessionId
    };
    return tableRepository.create(newTable);
  }

  async update(id, data) {
    const existing = await this.getById(id);
    if (data.sessionId) {
      const session = await sessionRepository.findById(data.sessionId);
      if (!session) throw { status: 404, message: 'Sesi tidak ditemukan' };
    }
    const updated = {
      name: data.name || existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      sessionId: data.sessionId || existing.sessionId
    };
    return tableRepository.update(id, updated);
  }

  async delete(id) {
    await this.getById(id);
    // Hapus juga kriteria & variabel di bawah tabel ini (cascade)
    const criteriaList = await criteriaRepository.findByTableId(id);
    for (const c of criteriaList) {
      const vars = await variableRepository.findByCriteriaId(c.id);
      for (const v of vars) {
        await variableRepository.delete(v.id);
      }
      await criteriaRepository.delete(c.id);
    }
    await tableRepository.delete(id);
    return { message: 'Tabel berhasil dihapus' };
  }
}

module.exports = new TableService();