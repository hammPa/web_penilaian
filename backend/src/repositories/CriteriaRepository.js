const BaseRepository = require('./BaseRepository');

class CriteriaRepository extends BaseRepository {
  constructor() {
    super('criteria.json');
  }
}

module.exports = new CriteriaRepository();