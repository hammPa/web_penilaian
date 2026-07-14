const BaseRepository = require('./BaseRepository');

class GroupRepository extends BaseRepository {
  constructor() {
    super('groups.json');
  }

  findByTeamId(teamId) {
    const groups = this.findAll();
    return groups.filter(g => g.teamId === teamId);
  }
}

module.exports = new GroupRepository();