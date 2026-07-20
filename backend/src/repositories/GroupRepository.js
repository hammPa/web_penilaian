const BaseRepository = require('./BaseRepository');
const { DB_MODE } = require('../config');

const MODE = (DB_MODE || 'json').toLowerCase();

class GroupRepository extends BaseRepository {
  constructor() {
    super('groups.json', {
      sqlTable: 'groups',
      columns: ['id', 'name', 'gugus', 'team_id'],
    });
  }

  toRow(entity) {
    return {
      id: entity.id,
      name: entity.name,
      gugus: entity.gugus,
      team_id: entity.teamId ?? null,
    };
  }

  fromRow(row) {
    if (!row) return row;
    return {
      id: row.id,
      name: row.name,
      gugus: row.gugus,
      teamId: row.team_id,
    };
  }

  async findByTeamId(teamId) {
    if (MODE === 'mariadb') return this._mariadbFindWhere('team_id', teamId);
    const groups = await this.findAll();
    return groups.filter(g => g.teamId === teamId);
  }
}

module.exports = new GroupRepository();