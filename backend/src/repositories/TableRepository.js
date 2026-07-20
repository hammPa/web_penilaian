const BaseRepository = require('./BaseRepository');
const { DB_MODE } = require('../config');

const MODE = (DB_MODE || 'json').toLowerCase();

class TableRepository extends BaseRepository {
  constructor() {
    // nama file json tetap "tables.json" (tidak berubah), tapi tabel SQL
    // relasionalnya dinamai "assessment_tables" -- lihat migrations/schema.sql.
    super('tables.json', {
      sqlTable: 'assessment_tables',
      columns: ['id', 'name', 'description', 'session_id'],
    });
  }

  toRow(entity) {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description ?? '',
      session_id: entity.sessionId,
    };
  }

  fromRow(row) {
    if (!row) return row;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      sessionId: row.session_id,
    };
  }

  async findBySessionId(sessionId) {
    if (MODE === 'mariadb') return this._mariadbFindWhere('session_id', sessionId);
    const tables = await this.findAll();
    return tables.filter(t => t.sessionId === sessionId);
  }
}

module.exports = new TableRepository();