const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
  constructor() {
    super('users.json');
  }

  findByUsername(username) {
    const users = this.findAll();
    return users.find(u => u.username === username) || null;
  }

  findById(id) { // override untuk menangani beda tipe data
    const users = this.findAll();
    return users.find(u => String(u.id) === String(id)) || null;
  }
}

module.exports = new UserRepository();