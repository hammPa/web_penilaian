const fs = require('fs');
const path = require('path');
const { DATA_DIR, DB_MODE } = require('../config');

const MODE = (DB_MODE || 'json').toLowerCase();

/**
 * BaseRepository sekarang ASYNC di ketiga mode (json, sqlite, mariadb),
 * supaya Service/Controller di atasnya bisa `await` tanpa peduli mode
 * mana yang aktif. Mode json & sqlite tetap sinkron di dalam, cuma
 * dibungkus Promise.resolve() biar konsisten -- perilakunya tidak berubah.
 *
 * Untuk mode mariadb, subclass WAJIB memanggil super() dengan opsi:
 *   { sqlTable, columns }
 * - sqlTable: nama tabel SQL relasional (lihat migrations/schema.sql)
 * - columns : daftar nama kolom SQL (urutan bebas), dipakai untuk generate
 *             INSERT/UPDATE generik. Kolom 'id' selalu wajib ada.
 *
 * Kalau entity punya field yang bentuknya beda antara objek JS <-> kolom SQL
 * (misal field JSON, atau penamaan camelCase -> snake_case), override
 * toRow(entity) dan fromRow(row) di subclass.
 */
class BaseRepository {
  constructor(filename, mariadbOptions = {}) {
    this.filename = filename;
    this.tableName = filename.replace(/\.json$/i, '');
    this.filePath = path.join(__dirname, '..', DATA_DIR, filename);

    this.sqlTable = mariadbOptions.sqlTable || this.tableName;
    this.columns = mariadbOptions.columns || ['id'];

    if (MODE === 'sqlite') {
      this.db = require('../config/db');
      this._initTable();
    }
    if (MODE === 'mariadb') {
      this.pool = require('../config/db-mariadb');
    }
  }

  // ---------- Hook default: override di subclass kalau perlu mapping ----------
  toRow(entity) {
    return entity;
  }
  fromRow(row) {
    return row;
  }

  // ---------- SQLITE (id + data blob, TIDAK BERUBAH dari sebelumnya) ----------
  _initTable() {
    this.db
      .prepare(
        `CREATE TABLE IF NOT EXISTS "${this.tableName}" (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL
        )`
      )
      .run();
  }

  _sqliteFindAll() {
    const rows = this.db.prepare(`SELECT data FROM "${this.tableName}"`).all();
    return rows.map(r => JSON.parse(r.data));
  }

  _sqliteFindById(id) {
    const row = this.db
      .prepare(`SELECT data FROM "${this.tableName}" WHERE id = ?`)
      .get(id);
    return row ? JSON.parse(row.data) : null;
  }

  _sqliteCreate(entity) {
    if (entity.id === undefined || entity.id === null) {
      throw new Error('create() requires entity.id to be set');
    }
    this.db
      .prepare(`INSERT INTO "${this.tableName}" (id, data) VALUES (?, ?)`)
      .run(String(entity.id), JSON.stringify(entity));
    return entity;
  }

  _sqliteUpdate(id, updatedData) {
    const existing = this._sqliteFindById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updatedData, id };
    this.db
      .prepare(`UPDATE "${this.tableName}" SET data = ? WHERE id = ?`)
      .run(JSON.stringify(merged), String(id));
    return merged;
  }

  _sqliteDelete(id) {
    const result = this.db
      .prepare(`DELETE FROM "${this.tableName}" WHERE id = ?`)
      .run(String(id));
    return result.changes > 0;
  }

  // ---------- JSON FILE (TIDAK BERUBAH dari sebelumnya) ----------
  _readFile() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf8');
      return JSON.parse(raw);
    } catch (err) {
      if (err.code === 'ENOENT') return [];
      throw err;
    }
  }

  _writeFile(data) {
    fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
  }

  // ---------- MARIADB (relasional, generik lewat this.columns) ----------
  async _mariadbFindAll() {
    const [rows] = await this.pool.query(`SELECT * FROM \`${this.sqlTable}\``);
    return rows.map(r => this.fromRow(r));
  }

  async _mariadbFindById(id) {
    const [rows] = await this.pool.query(
      `SELECT * FROM \`${this.sqlTable}\` WHERE id = ? LIMIT 1`,
      [id]
    );
    return rows[0] ? this.fromRow(rows[0]) : null;
  }

  async _mariadbFindWhere(column, value) {
    const [rows] = await this.pool.query(
      `SELECT * FROM \`${this.sqlTable}\` WHERE \`${column}\` = ?`,
      [value]
    );
    return rows.map(r => this.fromRow(r));
  }

  async _mariadbCreate(entity) {
    if (entity.id === undefined || entity.id === null) {
      throw new Error('create() requires entity.id to be set');
    }
    const row = this.toRow(entity);
    const cols = this.columns;
    const placeholders = cols.map(() => '?').join(', ');
    const colList = cols.map(c => `\`${c}\``).join(', ');
    await this.pool.query(
      `INSERT INTO \`${this.sqlTable}\` (${colList}) VALUES (${placeholders})`,
      cols.map(c => (row[c] === undefined ? null : row[c]))
    );
    return entity;
  }

  async _mariadbUpdate(id, updatedData) {
    const existing = await this._mariadbFindById(id);
    if (!existing) return null;
    const merged = { ...existing, ...updatedData, id };
    const row = this.toRow(merged);
    const updatableCols = this.columns.filter(c => c !== 'id');
    const setClause = updatableCols.map(c => `\`${c}\` = ?`).join(', ');
    const values = updatableCols.map(c => (row[c] === undefined ? null : row[c]));
    await this.pool.query(
      `UPDATE \`${this.sqlTable}\` SET ${setClause} WHERE id = ?`,
      [...values, id]
    );
    return merged;
  }

  async _mariadbDelete(id) {
    const [result] = await this.pool.query(
      `DELETE FROM \`${this.sqlTable}\` WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  }

  // ---------- PUBLIC API (dipakai controllers/services) ----------
  // Semua method sekarang mengembalikan Promise, terlepas dari mode aktif.
  async findAll() {
    if (MODE === 'mariadb') return this._mariadbFindAll();
    if (MODE === 'sqlite') return this._sqliteFindAll();
    return this._readFile();
  }

  async findById(id) {
    if (MODE === 'mariadb') return this._mariadbFindById(id);
    if (MODE === 'sqlite') return this._sqliteFindById(id);
    const items = this._readFile();
    return items.find(item => item.id === id) || null;
  }

  async create(entity) {
    if (MODE === 'mariadb') return this._mariadbCreate(entity);
    if (MODE === 'sqlite') return this._sqliteCreate(entity);
    const items = this._readFile();
    items.push(entity);
    this._writeFile(items);
    return entity;
  }

  async update(id, updatedData) {
    if (MODE === 'mariadb') return this._mariadbUpdate(id, updatedData);
    if (MODE === 'sqlite') return this._sqliteUpdate(id, updatedData);
    const items = this._readFile();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updatedData, id };
    this._writeFile(items);
    return items[index];
  }

  async delete(id) {
    if (MODE === 'mariadb') return this._mariadbDelete(id);
    if (MODE === 'sqlite') return this._sqliteDelete(id);
    const items = this._readFile();
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length === items.length) return false;
    this._writeFile(filtered);
    return true;
  }
}

module.exports = BaseRepository;