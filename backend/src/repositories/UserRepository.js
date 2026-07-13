const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users.json');
  }

  findByUsername(username) {
    const users = this.findAll();
    return users.find(u => u.username === username) || null;
  }
}

module.exports = new UserRepository();