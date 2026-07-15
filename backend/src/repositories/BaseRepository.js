const fs = require('fs');
const path = require('path');
const { DATA_DIR, DB_MODE } = require('../config');

const MODE = (DB_MODE || 'json').toLowerCase();

class BaseRepository {
  constructor(filename) {
    this.filename = filename;
    this.tableName = filename.replace(/\.json$/i, '');
    this.filePath = path.join(__dirname, '..', DATA_DIR, filename);

    if (MODE === 'sqlite') {
      this.db = require('../config/db');
      this._initTable();
    }
  }

  // ---------- SQLITE ----------
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

  // ---------- JSON FILE ----------
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

  // ---------- PUBLIC API (dipakai controllers/services, TIDAK BERUBAH) ----------
  findAll() {
    if (MODE === 'sqlite') return this._sqliteFindAll();
    return this._readFile();
  }

  findById(id) {
    if (MODE === 'sqlite') return this._sqliteFindById(id);
    const items = this.findAll();
    return items.find(item => item.id === id) || null;
  }

  create(entity) {
    if (MODE === 'sqlite') return this._sqliteCreate(entity);
    const items = this.findAll();
    items.push(entity);
    this._writeFile(items);
    return entity;
  }

  update(id, updatedData) {
    if (MODE === 'sqlite') return this._sqliteUpdate(id, updatedData);
    const items = this.findAll();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updatedData, id };
    this._writeFile(items);
    return items[index];
  }

  delete(id) {
    if (MODE === 'sqlite') return this._sqliteDelete(id);
    const items = this.findAll();
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length === items.length) return false;
    this._writeFile(filtered);
    return true;
  }
}

module.exports = BaseRepository;