const { v4: uuidv4 } = require('uuid');
const variableRepository = require('../repositories/VariableRepository');
const criteriaRepository = require('../repositories/CriteriaRepository');

class VariableService {
  getAll() {
    return variableRepository.findAll();
  }

  getByCriteriaId(criteriaId) {
    return variableRepository.findByCriteriaId(criteriaId);
  }

  getById(id) {
    const variable = variableRepository.findById(id);
    if (!variable) throw { status: 404, message: 'Variabel tidak ditemukan' };
    return variable;
  }

  create(data) {
    if (!data.name || !data.criteriaId || !data.weight || !data.formula) {
      throw { status: 400, message: 'Nama, kriteria, bobot, dan formula wajib diisi' };
    }
    if (!Array.isArray(data.levels) || data.levels.length !== 6) {
      throw { status: 400, message: 'Harus ada 6 level (0-5)' };
    }
    criteriaRepository.findById(data.criteriaId);
    
    const newVariable = {
      id: uuidv4(),
      criteriaId: data.criteriaId,
      name: data.name,
      weight: parseFloat(data.weight) || 1,
      formula: data.formula,
      description: data.description || '',
      levels: data.levels.map(level => ({
        description: level.description || ''
      }))
    };
    return variableRepository.create(newVariable);
  }

  update(id, data) {
    const existing = this.getById(id);
    if (data.criteriaId) {
      criteriaRepository.findById(data.criteriaId);
    }
    if (data.levels && (!Array.isArray(data.levels) || data.levels.length !== 6)) {
      throw { status: 400, message: 'Harus ada 6 level' };
    }
    const updated = {
      criteriaId: data.criteriaId || existing.criteriaId,
      name: data.name || existing.name,
      weight: data.weight !== undefined ? parseFloat(data.weight) : existing.weight,
      formula: data.formula || existing.formula,
      description: data.description !== undefined ? data.description : existing.description,
      levels: data.levels 
        ? data.levels.map(level => ({ description: level.description || '' }))
        : existing.levels
    };
    return variableRepository.update(id, updated);
  }

  delete(id) {
    this.getById(id);
    variableRepository.delete(id);
    return { message: 'Variabel berhasil dihapus' };
  }
}

module.exports = new VariableService();