const { v4: uuidv4 } = require('uuid');
const assessmentRepository = require('../repositories/AssessmentRepository');
const variableRepository = require('../repositories/VariableRepository');
const criteriaRepository = require('../repositories/CriteriaRepository');
const { evaluateFormula } = require('../utils/evaluator');

class AssessmentService {
  async create(userId, selections) {
    if (!Array.isArray(selections) || selections.length === 0) {
      throw { status: 400, message: 'Pilihan tidak boleh kosong' };
    }

    const allVariables = variableRepository.findAll();
    const variableMap = {};
    allVariables.forEach(v => { variableMap[v.id] = v; });

    const criteriaMap = {};
    allVariables.forEach(v => {
      if (!criteriaMap[v.criteriaId]) criteriaMap[v.criteriaId] = [];
      criteriaMap[v.criteriaId].push(v);
    });

    const variableScores = {};
    const subtotals = {};
    const details = []; // untuk menyimpan level yang dipilih

    const selectionMap = {};
    selections.forEach(s => {
      selectionMap[s.variableId] = s.selectedLevel; // level 0-5
    });

    let total = 0;

    for (const [criteriaId, variables] of Object.entries(criteriaMap)) {
      let subtotal = 0;
      variables.forEach(variable => {
        const variableId = variable.id;
        const selectedLevel = selectionMap[variableId] !== undefined ? selectionMap[variableId] : null;
        if (selectedLevel !== null) {
          const skor = selectedLevel; // 0-5
          const bobot = variable.weight;
          const score = evaluateFormula(variable.formula, { bobot, skor });
          variableScores[variableId] = score;
          subtotal += score;
          details.push({
            variableId,
            level: selectedLevel,
            score
          });
        }
      });
      if (variables.length > 0) {
        subtotals[criteriaId] = subtotal;
        total += subtotal;
      }
    }

    // Hitung maksimum untuk persentase
    let maxTotal = 0;
    for (const [criteriaId, variables] of Object.entries(criteriaMap)) {
      variables.forEach(variable => {
        const bobot = variable.weight;
        // Cari level tertinggi yang memiliki deskripsi (tidak kosong)
        const availableLevels = variable.levels
          .map((level, index) => ({ index, desc: level.description }))
          .filter(item => item.desc && item.desc.trim() !== '');
        const maxSkor = availableLevels.length > 0 
          ? Math.max(...availableLevels.map(l => l.index)) 
          : 0; // Jika tidak ada deskripsi sama sekali, dianggap 0
        const maxScore = evaluateFormula(variable.formula, { bobot, skor: maxSkor });
        maxTotal += maxScore;
      });
    }
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

    const assessment = {
      id: uuidv4(),
      userId,
      createdAt: new Date().toISOString(),
      selections: selections.map(s => ({
        variableId: s.variableId,
        selectedLevel: s.selectedLevel
      })),
      results: {
        variableScores,
        subtotals,
        total,
        percentage: Math.round(percentage * 100) / 100,
        details
      }
    };

    return assessmentRepository.create(assessment);
  }

  getAll(userId, role) {
    const all = assessmentRepository.findAll();
    if (role === 'admin') return all;
    return all.filter(a => a.userId === userId);
  }

  getById(id, userId, role) {
    const assessment = assessmentRepository.findById(id);
    if (!assessment) throw { status: 404, message: 'Penilaian tidak ditemukan' };
    if (role !== 'admin' && assessment.userId !== userId) {
      throw { status: 403, message: 'Akses ditolak' };
    }
    return assessment;
  }
}

module.exports = new AssessmentService();