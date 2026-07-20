const BaseRepository = require('./BaseRepository');

class TeamRepository extends BaseRepository {
  constructor() {
    super('teams.json', {
      sqlTable: 'teams',
      columns: ['id', 'name'],
    });
  }
}

module.exports = new TeamRepository();