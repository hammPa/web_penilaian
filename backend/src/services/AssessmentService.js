const { v4: uuidv4 } = require('uuid');
const assessmentRepository = require('../repositories/AssessmentRepository');
const variableRepository = require('../repositories/VariableRepository');
const criteriaRepository = require('../repositories/CriteriaRepository');
const tableRepository = require('../repositories/TableRepository');
const userRepository = require('../repositories/UserRepository');
const { evaluateFormula } = require('../utils/evaluator');

class AssessmentService {
  async create(userId, groupId, sessionId, selections, photos = []) {
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

    // batasi variabel & kriteria hanya milik SESI ini
    // (Tabel -> Kriteria -> Variabel). Tanpa ini, variabel/kriteria dari
    // sesi lain ikut terhitung
    const sessionTables = tableRepository.findBySessionId(sessionId);
    const sessionTableIds = new Set(sessionTables.map(t => t.id));

    const sessionCriteria = criteriaRepository
      .findAll()
      .filter(c => sessionTableIds.has(c.tableId));
    const sessionCriteriaIds = new Set(sessionCriteria.map(c => c.id));

    const allVariables = variableRepository
      .findAll()
      .filter(v => sessionCriteriaIds.has(v.criteriaId));

    const variableMap = {};
    allVariables.forEach(v => { variableMap[v.id] = v; });

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
          const bobot = variable.weight; // Koefisien per baris
          const score = evaluateFormula(variable.formula, { bobot, skor }); // Dikalikan sesuai formula
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

    // Hitung maksimum untuk persentase -- juga dibatasi ke variabel sesi ini saja
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
    // -------------------------------------------------------------

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
      photos: photos,
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
    const users = userRepository.findAll();

    // map id -> name agar proses pencarian cepat & efisien
    const userMap = {};
    users.forEach(u => { userMap[u.id] = u.name || 'No Name'; });

    const assessmentsWithUser = all.map(a => ({
      ...a,
      name: userMap[a.userId] || 'User Tidak Dikenal' // Tambah properti userName tanpa hapus userId
    }));

    if (role === 'admin') return assessmentsWithUser;
    return assessmentsWithUser.filter(a => a.userId === userId);
  }

  getById(id, userId, role) {
    const assessment = assessmentRepository.findById(id);
    if (!assessment) throw { status: 404, message: 'Penilaian tidak ditemukan' };
    if (role !== 'admin' && assessment.userId !== userId) {
      throw { status: 403, message: 'Akses ditolak' };
    }
    const user = userRepository.findById(assessment.userId);
    return {
      ...assessment,
      name: user ? user.name : 'User Tidak Dikenal'
    };
  }
}

module.exports = new AssessmentService();