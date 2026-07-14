const { v4: uuidv4 } = require('uuid');
const variableRepository = require('../repositories/VariableRepository');
const criteriaRepository = require('../repositories/CriteriaRepository');

const MIN_LEVELS = 2; // minimal harus ada 2 pilihan skor biar tetap bermakna

class VariableService {
  getAll() {
    return variableRepository.findAll();
  }

  getByCriteriaId(criteriaId) {
    return variableRepository.findByCriteriaId(criteriaId);
  }

  getById(id) {
    const variable = variableRepository.findById(id);
    if (!variable) throw { status: 404, message: 'Data tidak ditemukan' };
    return variable;
  }

  create(data) {
    if (!data.name || !data.criteriaId || data.weight === undefined || !data.formula) {
      throw { status: 400, message: 'Nama, kriteria, bobot, dan formula wajib diisi' };
    }
    if (!Array.isArray(data.variables) || data.variables.length < MIN_LEVELS) {
      throw { status: 400, message: `Minimal harus ada ${MIN_LEVELS} level skor` };
    }
    criteriaRepository.findById(data.criteriaId);
    const newVariable = {
      id: uuidv4(),
      criteriaId: data.criteriaId,
      name: data.name,
      weight: parseFloat(data.weight) || 1,
      formula: data.formula,
      variables: data.variables.map(v => ({
        description: v.description || ''
      }))
    };
    return variableRepository.create(newVariable);
  }

  update(id, data) {
    const existing = this.getById(id);
    if (data.criteriaId) {
      criteriaRepository.findById(data.criteriaId);
    }
    if (data.variables && (!Array.isArray(data.variables) || data.variables.length < MIN_LEVELS)) {
      throw { status: 400, message: `Minimal harus ada ${MIN_LEVELS} level skor` };
    }
    const updated = {
      criteriaId: data.criteriaId || existing.criteriaId,
      name: data.name || existing.name,
      weight: data.weight !== undefined ? parseFloat(data.weight) : existing.weight,
      formula: data.formula || existing.formula,
      variables: data.variables
        ? data.variables.map(v => ({ description: v.description || '' }))
        : existing.variables
    };
    return variableRepository.update(id, updated);
  }

  delete(id) {
    this.getById(id);
    variableRepository.delete(id);
    return { message: 'Data berhasil dihapus' };
  }
}

module.exports = new VariableService();