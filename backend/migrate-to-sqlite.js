/**
 * Migrasi satu kali: pindahkan semua data dari file .json di DATA_DIR
 * ke database sqlite (DB_FILE).
 *
 * Jalankan: node migrate-json-to-sqlite.js
 * (pastikan DB_MODE tidak harus sqlite dulu saat menjalankan ini,
 *  script ini baca file .json langsung dan tulis ke sqlite)
 */

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const { DATA_DIR, DB_FILE } = require('./src/config');

const files = [
  'assessments.json',
  'criteria.json',
  'groups.json',
  'sessions.json',
  'tables.json',
  'teams.json',
  'users.json',
  'variables.json',
];

const dbPath = path.join(__dirname, 'src', DATA_DIR, DB_FILE || 'web.sqlite');

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

for (const filename of files) {
  const filePath = path.join(__dirname, 'src', DATA_DIR, filename);
  const tableName = filename.replace(/\.json$/i, '');

  if (!fs.existsSync(filePath)) {
    console.log(`skip ${filename} (tidak ditemukan)`);
    continue;
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const items = JSON.parse(raw);

  db.prepare(
    `CREATE TABLE IF NOT EXISTS "${tableName}" (
      id TEXT PRIMARY KEY,
      data TEXT NOT NULL
    )`
  ).run();

  const insert = db.prepare(
    `INSERT OR REPLACE INTO "${tableName}" (id, data) VALUES (?, ?)`
  );

  const insertMany = db.transaction(rows => {
    for (const row of rows) {
      if (row.id === undefined || row.id === null) {
        console.warn(`  -> lewati item tanpa id di ${filename}`);
        continue;
      }
      insert.run(String(row.id), JSON.stringify(row));
    }
  });

  insertMany(items);
  console.log(`✔ migrasi ${items.length} baris dari ${filename} -> tabel "${tableName}"`);
}

console.log('Selesai. Set DB_MODE=sqlite di .env untuk mulai memakainya.');