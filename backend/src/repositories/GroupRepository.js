const BaseRepository = require('./BaseRepository');

class GroupRepository extends BaseRepository {
  constructor() {
    super('groups.json');
  }
}

module.exports = new GroupRepository();