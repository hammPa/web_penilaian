const BaseRepository = require('./BaseRepository');

class TableRepository extends BaseRepository {
  constructor() {
    super('tables.json');
  }
}

module.exports = new TableRepository();