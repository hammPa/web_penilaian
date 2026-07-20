const BaseRepository = require('./BaseRepository');
const { DB_MODE } = require('../config');

const MODE = (DB_MODE || 'json').toLowerCase();

class CriteriaRepository extends BaseRepository {
  constructor() {
    super('criteria.json', {
      sqlTable: 'criteria',
      columns: ['id', 'name', 'description', 'table_id'],
    });
  }

  toRow(entity) {
    return {
      id: entity.id,
      name: entity.name,
      description: entity.description ?? '',
      table_id: entity.tableId,
    };
  }

  fromRow(row) {
    if (!row) return row;
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      tableId: row.table_id,
    };
  }

  async findByTableId(tableId) {
    if (MODE === 'mariadb') return this._mariadbFindWhere('table_id', tableId);
    const criteria = await this.findAll();
    return criteria.filter(c => c.tableId === tableId);
  }
}

module.exports = new CriteriaRepository();