const path = require('path');
const Database = require('better-sqlite3');
const { DATA_DIR, DB_FILE } = require('./index');

const dbPath = path.join(__dirname, '..', DATA_DIR, DB_FILE || 'web.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

module.exports = db;