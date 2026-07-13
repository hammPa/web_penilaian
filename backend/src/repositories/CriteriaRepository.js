const BaseRepository = require('./BaseRepository');

class CriteriaRepository extends BaseRepository {
  constructor() {
    super('criteria.json');
  }

  findByTableId(tableId) {
    const criteria = this.findAll();
    return criteria.filter(c => c.tableId === tableId);
  }
}

module.exports = new CriteriaRepository();