const BaseRepository = require('./BaseRepository');
const { DB_MODE } = require('../config');

const MODE = (DB_MODE || 'json').toLowerCase();

class UserRepository extends BaseRepository {
  constructor() {
    super('users.json', {
      sqlTable: 'users',
      columns: [
        'id', 'name', 'username', 'password', 'role', 'team_id',
        'active_token', 'password_reset_at', 'password_reset_by',
      ],
    });
  }

  // entity JS (camelCase) -> row SQL (snake_case)
  toRow(entity) {
    return {
      id: entity.id,
      name: entity.name,
      username: entity.username,
      password: entity.password,
      role: entity.role,
      team_id: entity.teamId ?? null,
      active_token: entity.activeToken ?? null,
      password_reset_at: entity.passwordResetAt ?? null,
      password_reset_by: entity.passwordResetBy ?? null,
    };
  }

  // row SQL (snake_case) -> entity JS (camelCase)
  fromRow(row) {
    if (!row) return row;
    return {
      id: row.id,
      name: row.name,
      username: row.username,
      password: row.password,
      role: row.role,
      teamId: row.team_id,
      activeToken: row.active_token,
      passwordResetAt: row.password_reset_at,
      passwordResetBy: row.password_reset_by,
    };
  }

  async findByUsername(username) {
    if (MODE === 'mariadb') {
      const [rows] = await this.pool.query(
        'SELECT * FROM `users` WHERE username = ? LIMIT 1',
        [username]
      );
      return rows[0] ? this.fromRow(rows[0]) : null;
    }
    const users = await this.findAll();
    return users.find(u => u.username === username) || null;
  }

  // override untuk menangani beda tipe data id (json mode bisa nyimpen id non-string)
  async findById(id) {
    if (MODE === 'mariadb' || MODE === 'sqlite') {
      return super.findById(id);
    }
    const users = await this.findAll();
    return users.find(u => String(u.id) === String(id)) || null;
  }
}

module.exports = new UserRepository();