const { v4: uuidv4 } = require('uuid');
const sessionRepository = require('../repositories/SessionRepository');
const tableRepository = require('../repositories/TableRepository');
const criteriaRepository = require('../repositories/CriteriaRepository');
const variableRepository = require('../repositories/VariableRepository');

class SessionService {
  async getAll() {
    // Terbaru duluan biar landing page enak dibaca
    const all = await sessionRepository.findAll();
    return all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  async getById(id) {
    const session = await sessionRepository.findById(id);
    if (!session) throw { status: 404, message: 'Sesi tidak ditemukan' };
    return session;
  }

  async create(data) {
    if (!data.name) {
      throw { status: 400, message: 'Nama sesi wajib diisi' };
    }
    const newSession = {
      id: uuidv4(),
      name: data.name, // mis. "Semester 1 2026"
      description: data.description || '',
      createdAt: new Date().toISOString()
    };
    return sessionRepository.create(newSession);
  }

  async update(id, data) {
    const existing = await this.getById(id);
    const updated = {
      name: data.name || existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      createdAt: existing.createdAt
    };
    return sessionRepository.update(id, updated);
  }

  async delete(id) {
    await this.getById(id);
    // Cascade penuh: hapus semua Tabel->Kriteria->Variabel milik sesi ini
    const tables = await tableRepository.findBySessionId(id);
    for (const t of tables) {
      const criteriaList = await criteriaRepository.findByTableId(t.id);
      for (const c of criteriaList) {
        const vars = await variableRepository.findByCriteriaId(c.id);
        for (const v of vars) {
          await variableRepository.delete(v.id);
        }
        await criteriaRepository.delete(c.id);
      }
      await tableRepository.delete(t.id);
    }
    await sessionRepository.delete(id);
    return { message: 'Sesi berhasil dihapus' };
  }

  /**
   * Deep-copy semua Tabel -> Kriteria -> Variabel dari sourceSessionId
   * ke sesi baru. ID lama di-remap ke ID baru supaya tidak nabrak/berbagi
   * referensi dengan sesi sumbernya.
   */
  async duplicate(sourceSessionId, data) {
    const sourceSession = await this.getById(sourceSessionId);
    if (!data.name) {
      throw { status: 400, message: 'Nama sesi baru wajib diisi' };
    }

    const newSession = {
      id: uuidv4(),
      name: data.name,
      description: data.description || `Duplikat dari ${sourceSession.name}`,
      createdAt: new Date().toISOString()
    };
    await sessionRepository.create(newSession);

    const sourceTables = await tableRepository.findBySessionId(sourceSessionId);

    for (const oldTable of sourceTables) {
      const newTableId = uuidv4();
      await tableRepository.create({
        id: newTableId,
        name: oldTable.name,
        description: oldTable.description,
        sessionId: newSession.id
      });

      const oldCriteriaList = await criteriaRepository.findByTableId(oldTable.id);
      for (const oldCriteria of oldCriteriaList) {
        const newCriteriaId = uuidv4();
        await criteriaRepository.create({
          id: newCriteriaId,
          name: oldCriteria.name,
          description: oldCriteria.description,
          tableId: newTableId
        });

        const oldVariables = await variableRepository.findByCriteriaId(oldCriteria.id);
        for (const oldVariable of oldVariables) {
          await variableRepository.create({
            id: uuidv4(),
            name: oldVariable.name,
            criteriaId: newCriteriaId,
            weight: oldVariable.weight,
            formula: oldVariable.formula,
            variables: (oldVariable.variables || []).map(v => ({ description: v.description }))
          });
        }
      }
    }

    return newSession;
  }
}

module.exports = new SessionService();