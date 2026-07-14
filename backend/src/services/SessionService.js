const { v4: uuidv4 } = require('uuid');
const sessionRepository = require('../repositories/SessionRepository');
const tableRepository = require('../repositories/TableRepository');
const criteriaRepository = require('../repositories/CriteriaRepository');
const variableRepository = require('../repositories/VariableRepository');

class SessionService {
  getAll() {
    // Terbaru duluan biar landing page enak dibaca
    return sessionRepository.findAll().sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );
  }

  getById(id) {
    const session = sessionRepository.findById(id);
    if (!session) throw { status: 404, message: 'Sesi tidak ditemukan' };
    return session;
  }

  create(data) {
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

  update(id, data) {
    const existing = this.getById(id);
    const updated = {
      name: data.name || existing.name,
      description: data.description !== undefined ? data.description : existing.description,
      createdAt: existing.createdAt
    };
    return sessionRepository.update(id, updated);
  }

  delete(id) {
    this.getById(id);
    // Cascade penuh: hapus semua Tabel->Kriteria->Variabel milik sesi ini
    const tables = tableRepository.findBySessionId(id);
    tables.forEach(t => {
      const criteriaList = criteriaRepository.findByTableId(t.id);
      criteriaList.forEach(c => {
        variableRepository.findByCriteriaId(c.id).forEach(v => variableRepository.delete(v.id));
        criteriaRepository.delete(c.id);
      });
      tableRepository.delete(t.id);
    });
    sessionRepository.delete(id);
    return { message: 'Sesi berhasil dihapus' };
  }

  /**
   * Deep-copy semua Tabel -> Kriteria -> Variabel dari sourceSessionId
   * ke sesi baru. ID lama di-remap ke ID baru supaya tidak nabrak/berbagi
   * referensi dengan sesi sumbernya.
   */
  duplicate(sourceSessionId, data) {
    const sourceSession = this.getById(sourceSessionId);
    if (!data.name) {
      throw { status: 400, message: 'Nama sesi baru wajib diisi' };
    }

    const newSession = {
      id: uuidv4(),
      name: data.name,
      description: data.description || `Duplikat dari ${sourceSession.name}`,
      createdAt: new Date().toISOString()
    };
    sessionRepository.create(newSession);

    const sourceTables = tableRepository.findBySessionId(sourceSessionId);

    sourceTables.forEach(oldTable => {
      const newTableId = uuidv4();
      tableRepository.create({
        id: newTableId,
        name: oldTable.name,
        description: oldTable.description,
        sessionId: newSession.id
      });

      const oldCriteriaList = criteriaRepository.findByTableId(oldTable.id);
      oldCriteriaList.forEach(oldCriteria => {
        const newCriteriaId = uuidv4();
        criteriaRepository.create({
          id: newCriteriaId,
          name: oldCriteria.name,
          description: oldCriteria.description,
          tableId: newTableId
        });

        const oldVariables = variableRepository.findByCriteriaId(oldCriteria.id);
        oldVariables.forEach(oldVariable => {
          variableRepository.create({
            id: uuidv4(),
            name: oldVariable.name,
            criteriaId: newCriteriaId,
            weight: oldVariable.weight,
            formula: oldVariable.formula,
            variables: (oldVariable.variables || []).map(v => ({ description: v.description }))
          });
        });
      });
    });

    return newSession;
  }
}

module.exports = new SessionService();