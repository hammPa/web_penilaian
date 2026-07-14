const BaseRepository = require('./BaseRepository');

class TableRepository extends BaseRepository {
  constructor() {
    super('tables.json');
  }

  findBySessionId(sessionId) {
    const tables = this.findAll();
    return tables.filter(t => t.sessionId === sessionId);
  }
}

module.exports = new TableRepository();