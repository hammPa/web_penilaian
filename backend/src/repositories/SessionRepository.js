const BaseRepository = require('./BaseRepository');

class SessionRepository extends BaseRepository {
  constructor() {
    super('sessions.json');
  }
}

module.exports = new SessionRepository();