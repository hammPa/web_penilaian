const BaseRepository = require('./BaseRepository');
const { DB_MODE } = require('../config');
const { toMysqlDatetime, fromMysqlDatetime } = require('../utils/dateHelper');

const MODE = (DB_MODE || 'json').toLowerCase();

function parseJsonField(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'object') return value; // mysql2 sudah auto-decode kolom JSON
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

class AssessmentRepository extends BaseRepository {
  constructor() {
    super('assessments.json', {
      sqlTable: 'assessments',
      columns: [
        'id', 'user_id', 'group_id', 'session_id',
        'selections_json', 'photos_json', 'recommendation', 'results_json',
        'created_at', 'updated_at',
      ],
    });
  }

  toRow(entity) {
    return {
      id: entity.id,
      user_id: entity.userId,
      group_id: entity.groupId,
      session_id: entity.sessionId,
      selections_json: JSON.stringify(entity.selections || []),
      photos_json: JSON.stringify(entity.photos || []),
      recommendation: entity.recommendation || '',
      results_json: JSON.stringify(entity.results || {}),
      // created_at & updated_at: kolom DATETIME di mariadb butuh format
      // "YYYY-MM-DD HH:MM:SS", bukan ISO string ("...T...Z") -- lihat dateHelper.js.
      // Mode json/sqlite tetap pakai ISO string apa adanya (tidak berubah perilaku).
      created_at: MODE === 'mariadb' ? toMysqlDatetime(entity.createdAt) : entity.createdAt,
      updated_at: MODE === 'mariadb' ? toMysqlDatetime(entity.updatedAt) : (entity.updatedAt || null),
    };
  }

  fromRow(row) {
    if (!row) return row;
    return {
      id: row.id,
      userId: row.user_id,
      groupId: row.group_id,
      sessionId: row.session_id,
      selections: parseJsonField(row.selections_json, []),
      photos: parseJsonField(row.photos_json, []),
      recommendation: row.recommendation,
      results: parseJsonField(row.results_json, {}),
      // dibalikin ke ISO string lagi supaya konsisten dengan mode json/sqlite
      createdAt: MODE === 'mariadb' ? fromMysqlDatetime(row.created_at) : row.created_at,
      updatedAt: MODE === 'mariadb' ? fromMysqlDatetime(row.updated_at) : row.updated_at,
    };
  }

  async findByUserId(userId) {
    if (MODE === 'mariadb') return this._mariadbFindWhere('user_id', userId);
    const assessments = await this.findAll();
    return assessments.filter(a => a.userId === userId);
  }
}

module.exports = new AssessmentRepository();