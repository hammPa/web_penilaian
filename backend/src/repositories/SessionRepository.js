const BaseRepository = require('./BaseRepository');
const { DB_MODE } = require('../config');
const { toMysqlDatetime, fromMysqlDatetime } = require('../utils/dateHelper');

const MODE = (DB_MODE || 'json').toLowerCase();

class SessionRepository extends BaseRepository {
  constructor() {
    super('sessions.json', {
      sqlTable: 'sessions',
      columns: ['id', 'name', 'description', 'created_at'],
    });
  }

  toRow(entity) {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description ?? '',
      // created_at: kolom DATETIME di mariadb butuh format "YYYY-MM-DD HH:MM:SS",
      // bukan ISO string ("...T...Z") -- lihat dateHelper.js.
      // Mode json/sqlite tetap pakai ISO string apa adanya (tidak berubah perilaku).
      created_at: MODE === 'mariadb' ? toMysqlDatetime(entity.createdAt) : entity.createdAt,
    };
  }

  fromRow(row) {
    if (!row) return row;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      // dibalikin ke ISO string lagi supaya konsisten dengan mode json/sqlite
      // (services lain, mis. SessionService.getAll(), sort pakai new Date(createdAt)).
      createdAt: MODE === 'mariadb' ? fromMysqlDatetime(row.created_at) : row.created_at,
    };
  }
}

module.exports = new SessionRepository();