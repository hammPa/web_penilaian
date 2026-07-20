const BaseRepository = require('./BaseRepository');
const { DB_MODE } = require('../config');

const MODE = (DB_MODE || 'json').toLowerCase();

function parseLevels(value) {
  if (value === null || value === undefined) return [];
  if (Array.isArray(value)) return value; // mysql2 sudah auto-decode kolom JSON
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

class VariableRepository extends BaseRepository {
  constructor() {
    super('variables.json', {
      sqlTable: 'variables',
      columns: ['id', 'name', 'criteria_id', 'weight', 'formula', 'levels_json'],
    });
  }

  toRow(entity) {
    return {
      id: entity.id,
      name: entity.name,
      criteria_id: entity.criteriaId,
      weight: entity.weight,
      formula: entity.formula,
      levels_json: JSON.stringify(entity.variables || entity.levels || []),
    };
  }

  fromRow(row) {
    if (!row) return row;
    return {
      id: row.id,
      name: row.name,
      criteriaId: row.criteria_id,
      weight: row.weight,
      formula: row.formula,
      variables: parseLevels(row.levels_json),
    };
  }

  async findByCriteriaId(criteriaId) {
    if (MODE === 'mariadb') return this._mariadbFindWhere('criteria_id', criteriaId);
    const variables = await this.findAll();
    return variables.filter(v => v.criteriaId === criteriaId);
  }
}

module.exports = new VariableRepository();