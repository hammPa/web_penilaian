const { v4: uuidv4 } = require('uuid');
const assessmentRepository = require('../repositories/AssessmentRepository');
const variableRepository = require('../repositories/VariableRepository');
const criteriaRepository = require('../repositories/CriteriaRepository');
const tableRepository = require('../repositories/TableRepository');
const userRepository = require('../repositories/UserRepository');
const groupRepository = require('../repositories/GroupRepository');
const sessionRepository = require('../repositories/SessionRepository');
const teamRepository = require('../repositories/TeamRepository');
const { evaluateFormula } = require('../utils/evaluator');

class AssessmentService {
  // Helper baru: hitung hasil (results) dari selections, dibatasi ke variabel milik sessionId
  _calculateResults(sessionId, selections) {
    const sessionTables = tableRepository.findBySessionId(sessionId);
    const sessionTableIds = new Set(sessionTables.map(t => t.id));

    const sessionCriteria = criteriaRepository
      .findAll()
      .filter(c => sessionTableIds.has(c.tableId));
    const sessionCriteriaIds = new Set(sessionCriteria.map(c => c.id));

    const allVariables = variableRepository
      .findAll()
      .filter(v => sessionCriteriaIds.has(v.criteriaId));

    const criteriaMap = {};
    allVariables.forEach(v => {
      if (!criteriaMap[v.criteriaId]) criteriaMap[v.criteriaId] = [];
      criteriaMap[v.criteriaId].push(v);
    });

    const variableScores = {};
    const subtotals = {};
    const details = [];

    const selectionMap = {};
    selections.forEach(s => {
      selectionMap[s.variableId] = s.selectedLevel;
    });

    let total = 0;

    for (const [criteriaId, variables] of Object.entries(criteriaMap)) {
      let subtotal = 0;
      variables.forEach(variable => {
        const variableId = variable.id;
        const selectedLevel = selectionMap[variableId] !== undefined ? selectionMap[variableId] : null;
        if (selectedLevel !== null) {
          const skor = selectedLevel;
          const bobot = variable.weight;
          const score = evaluateFormula(variable.formula, { bobot, skor });
          variableScores[variableId] = score;
          subtotal += score;
          details.push({ variableId, level: selectedLevel, score });
        }
      });
      if (variables.length > 0) {
        subtotals[criteriaId] = subtotal;
        total += subtotal;
      }
    }

    let maxTotal = 0;
    for (const [criteriaId, variables] of Object.entries(criteriaMap)) {
      variables.forEach(variable => {
        const bobot = variable.weight;
        const levelList = variable.variables || variable.levels || [];
        const availableLevels = levelList
          .map((level, index) => ({ index, desc: level?.description || '' }))
          .filter(item => {
            const desc = item.desc.trim();
            return desc !== '' && desc !== '-';
          });
        const maxSkor = availableLevels.length > 0
          ? Math.max(...availableLevels.map(l => l.index))
          : 0;
        const maxScore = evaluateFormula(variable.formula, { bobot, skor: maxSkor });
        maxTotal += maxScore;
      });
    }
    const percentage = maxTotal > 0 ? (total / maxTotal) * 100 : 0;

    return {
      variableScores,
      subtotals,
      total,
      percentage: Math.round(percentage * 100) / 100,
      details
    };
  }

  async create(userId, groupId, sessionId, selections, photos = [], recommendation = '') {
    if (!groupId || !sessionId) {
      throw { status: 400, message: 'Grup dan Sesi wajib disertakan' };
    }

    if (!Array.isArray(selections) || selections.length === 0) {
      throw { status: 400, message: 'Pilihan tidak boleh kosong' };
    }

    const existing = assessmentRepository.findAll().find(
      a => a.userId === userId && a.groupId === groupId && a.sessionId === sessionId
    );

    if (existing) {
      throw { status: 400, message: 'Grup ini sudah Anda nilai pada semester/sesi tersebut.' };
    }

    const results = this._calculateResults(sessionId, selections);

    const assessment = {
      id: uuidv4(),
      userId,
      groupId,
      sessionId,
      createdAt: new Date().toISOString(),
      selections: selections.map(s => ({
        variableId: s.variableId,
        selectedLevel: s.selectedLevel
      })),
      photos,
      recommendation: recommendation,
      results
    };

    return assessmentRepository.create(assessment);
  }

  // update assessment milik sendiri (atau admin)
  async update(id, userId, role, { selections, photos, recommendation }) {
    const assessment = assessmentRepository.findById(id);
    if (!assessment) throw { status: 404, message: 'Penilaian tidak ditemukan' };

    if (role !== 'admin' && assessment.userId !== userId) {
      throw { status: 403, message: 'Akses ditolak' };
    }

    if (!Array.isArray(selections) || selections.length === 0) {
      throw { status: 400, message: 'Pilihan tidak boleh kosong' };
    }

    // groupId & sessionId sengaja TIDAK diubah lewat edit,
    // supaya tidak bentrok dengan pengecekan "sudah dinilai" punya sesi lain
    const results = this._calculateResults(assessment.sessionId, selections);

    const updated = {
      ...assessment,
      selections: selections.map(s => ({
        variableId: s.variableId,
        selectedLevel: s.selectedLevel
      })),
      photos: photos !== undefined ? photos : assessment.photos,
      results,
      recommendation,
      updatedAt: new Date().toISOString()
    };

    return assessmentRepository.update(id, updated);
  }

  _enrichWithNames(assessment, userMap) {
    const group = groupRepository.findById(assessment.groupId);
    const session = sessionRepository.findById(assessment.sessionId);
    const team = group?.teamId ? teamRepository.findById(group.teamId) : null;

    return {
      ...assessment,
      name: userMap ? (userMap[assessment.userId] || 'User Tidak Dikenal') : assessment.name,
      groupName: group?.name || 'Grup tidak ditemukan',
      sessionName: session?.name || 'Sesi tidak ditemukan',
      teamName: team?.name || '-'
    };
  }

  getAll(userId, role) {
    const all = assessmentRepository.findAll();
    const users = userRepository.findAll();

    // map id -> name agar proses pencarian cepat & efisien
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.name || 'No Name'; });

    const enriched = all.map(a => this._enrichWithNames(a, userMap));

    if (role === 'admin') return enriched; // awalnya aassessment withuser
    return enriched.filter(a => a.userId === userId);
  }

  getById(id, userId, role) {
    const assessment = assessmentRepository.findById(id);
    if (!assessment) throw { status: 404, message: 'Penilaian tidak ditemukan' };
    if (role !== 'admin' && assessment.userId !== userId) {
      throw { status: 403, message: 'Akses ditolak' };
    }
    const user = userRepository.findById(assessment.userId);
    const withUser = { ...assessment, name: user ? user.name : 'User Tidak Dikenal' };
    return this._enrichWithNames(withUser);
  }
}

module.exports = new AssessmentService();