const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../config');

class BaseRepository {
  constructor(filename) {
    this.filePath = path.join(__dirname, '..', DATA_DIR, filename);
  }

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

  findAll() {
    return this._readFile();
  }

  findById(id) {
    const items = this.findAll();
    return items.find(item => item.id === id) || null;
  }

  create(entity) {
    const items = this.findAll();
    items.push(entity);
    this._writeFile(items);
    return entity;
  }

  update(id, updatedData) {
    const items = this.findAll();
    const index = items.findIndex(item => item.id === id);
    if (index === -1) return null;
    items[index] = { ...items[index], ...updatedData, id };
    this._writeFile(items);
    return items[index];
  }

  delete(id) {
    const items = this.findAll();
    const filtered = items.filter(item => item.id !== id);
    if (filtered.length === items.length) return false;
    this._writeFile(filtered);
    return true;
  }
}

module.exports = BaseRepository;