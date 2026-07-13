const BaseRepository = require('./BaseRepository');

class TeamRepository extends BaseRepository {
  constructor() {
    super('teams.json');
  }
}

module.exports = new TeamRepository();