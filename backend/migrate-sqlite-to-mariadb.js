/**
 * Migrasi data dari mode sqlite (id + data blob) ke mode mariadb (relasional,
 * termasuk skema assessments yang sudah dipecah jadi 4 tabel anak:
 * assessment_selections, assessment_photos, assessment_variable_scores,
 * assessment_criteria_subtotals).
 *
 * Script ini BERDIRI SENDIRI -- tidak bergantung pada DB_MODE di .env,
 * supaya bisa baca sqlite & tulis ke mariadb dalam proses yang sama tanpa
 * bentrok. Kredensial mariadb & path sqlite tetap diambil dari config/.env
 * yang sama dengan aplikasi.
 *
 * SEKARANG SCHEMA DIJALANKAN OTOMATIS: sebelum migrasi data, script ini baca
 * schema_final.sql (harus ada di folder yang sama dengan script ini) dan
 * eksekusi semua CREATE TABLE IF NOT EXISTS-nya. Jadi kamu TIDAK perlu lagi
 * jalankan schema.sql secara manual duluan -- cukup pastikan database kosong
 * (atau minimal belum punya tabel-tabel ini) sudah dibuat di MariaDB.
 *
 * CARA PAKAI (dari root backend/, dengan schema_final.sql di folder yang sama):
 *   node migrate-sqlite-to-mariadb.js
 *
 * Aman dijalankan ulang (idempotent) -- CREATE TABLE pakai IF NOT EXISTS,
 * dan baris data yang sudah ada (by id) akan di-update/replace, bukan
 * bikin duplikat / error.
 */

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');
const { v4: uuidv4 } = require('uuid');
const {
  DATA_DIR, DB_FILE,
  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME,
} = require('./src/config');

const sqlitePath = path.join(__dirname, 'src', DATA_DIR, DB_FILE || 'web_penilaian.sqlite');
const schemaPath = path.join(__dirname, 'schema_final.sql');

// jalankan schema_final.sql duluan (CREATE TABLE IF NOT EXISTS,
// jadi aman dijalankan berkali-kali & tidak menimpa tabel yang sudah ada)
async function applySchema(conn) {
  const sql = fs.readFileSync(schemaPath, 'utf8');
  // split per statement (aman untuk schema ini karena tidak ada ';' di dalam
  // string/comment manapun) -- buang komentar baris & baris kosong dulu.
  const statements = sql
    .split('\n')
    .filter(line => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map(s => s.trim())
    .filter(Boolean);

  console.log(`Menjalankan schema_final.sql (${statements.length} statement)...`);
  for (const stmt of statements) {
    await conn.query(stmt);
  }
  console.log('Schema OK (tabel dibuat kalau belum ada, tabel existing tidak diubah/hilang).');
}

// helper baca sqlite (format lama: id + data JSON)
function readSqliteTable(db, tableName) {
  const exists = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
    .get(tableName);
  if (!exists) return [];
  const rows = db.prepare(`SELECT data FROM "${tableName}"`).all();
  return rows.map(r => JSON.parse(r.data));
}

// helper format datetime MySQL
function formatForMysql(isoString) {
  if (!isoString) return null;
  const d = new Date(isoString);
  if (isNaN(d)) return null;
  // '2026-07-14T14:08:43.581Z' -> '2026-07-14 14:08:43'
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

// mapping entity JS -> row SQL, buat tabel-tabel NON-assessments
// (assessments ditangani terpisah di bawah karena sekarang nyebar ke 5 tabel)
const mappers = {
  teams: (t) => ({
    columns: ['id', 'name'],
    values: [t.id, t.name],
  }),
  users: (u) => ({
    columns: ['id', 'name', 'username', 'password', 'role', 'team_id', 'active_token', 'password_reset_at', 'password_reset_by'],
    // data lama kadang nyimpen teamId sebagai string kosong '' (bukan null) --
    // di sqlite ini gak masalah karena gak ada FK, tapi di mariadb '' dianggap
    // "harus ada tim dengan id ''" dan gagal FK. Anggap '' sama seperti null.
    values: [u.id, u.name, u.username, u.password, u.role, (u.teamId && String(u.teamId).trim() !== '') ? u.teamId : null, u.activeToken ?? null, formatForMysql(u.passwordResetAt), u.passwordResetBy ?? null],
  }),
  groups: (g) => ({
    columns: ['id', 'name', 'gugus', 'team_id'],
    values: [g.id, g.name, g.gugus, g.teamId ?? null],
  }),
  sessions: (s) => ({
    columns: ['id', 'name', 'description', 'created_at'],
    values: [s.id, s.name, s.description ?? '', formatForMysql(s.createdAt) || formatForMysql(new Date().toISOString())],
  }),
  assessment_tables: (t) => ({
    columns: ['id', 'name', 'description', 'session_id'],
    values: [t.id, t.name, t.description ?? '', t.sessionId],
  }),
  criteria: (c) => ({
    columns: ['id', 'name', 'description', 'table_id'],
    values: [c.id, c.name, c.description ?? '', c.tableId],
  }),
  variables: (v) => ({
    columns: ['id', 'name', 'criteria_id', 'weight', 'formula', 'levels_json'],
    values: [v.id, v.name, v.criteriaId, v.weight, v.formula, JSON.stringify(v.variables || v.levels || [])],
  }),
};

// Urutan WAJIB sesuai dependency FK: parent dulu baru child.
// filename sqlite lama -> nama tabel sql baru. "assessments" SENGAJA tidak
// dimasukkan di sini -- ditangani sendiri oleh migrateAssessments().
const TABLE_ORDER = [
  { sqliteFile: 'teams',       sqlTable: 'teams' },
  { sqliteFile: 'users',       sqlTable: 'users' },
  { sqliteFile: 'groups',      sqlTable: 'groups' },
  { sqliteFile: 'sessions',    sqlTable: 'sessions' },
  { sqliteFile: 'tables',      sqlTable: 'assessment_tables' },
  { sqliteFile: 'criteria',    sqlTable: 'criteria' },
  { sqliteFile: 'variables',   sqlTable: 'variables' },
];

async function upsertBatch(conn, sqlTable, rows, mapFn) {
  if (rows.length === 0) return 0;
  let count = 0;
  for (const entity of rows) {
    const { columns, values } = mapFn(entity);
    const colList = columns.map(c => `\`${c}\``).join(', ');
    const placeholders = columns.map(() => '?').join(', ');
    const updateClause = columns
      .filter(c => c !== 'id')
      .map(c => `\`${c}\` = VALUES(\`${c}\`)`)
      .join(', ');
    await conn.query(
      `INSERT INTO \`${sqlTable}\` (${colList}) VALUES (${placeholders})
       ON DUPLICATE KEY UPDATE ${updateClause}`,
      values
    );
    count++;
  }
  return count;
}

// assessments: 1 entity sqlite -> 1 baris utama + 4 tabel anak
async function migrateAssessments(conn, sqliteDb) {
  const rows = readSqliteTable(sqliteDb, 'assessments');
  let count = 0;

  for (const a of rows) {
    const results = a.results || {};
    const selections = a.selections || [];
    const photos = a.photos || [];
    const details = results.details || [];
    const subtotals = results.subtotals || {};

    // 1) baris utama assessments (kolom scalar aja, tanpa JSON blob)
    await conn.query(
      `INSERT INTO \`assessments\`
        (id, user_id, group_id, session_id, recommendation, total, percentage, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        user_id = VALUES(user_id), group_id = VALUES(group_id), session_id = VALUES(session_id),
        recommendation = VALUES(recommendation), total = VALUES(total), percentage = VALUES(percentage),
        created_at = VALUES(created_at), updated_at = VALUES(updated_at)`,
      [
        a.id, a.userId, a.groupId, a.sessionId,
        a.recommendation || '',
        results.total || 0,
        results.percentage || 0,
        formatForMysql(a.createdAt) || formatForMysql(new Date().toISOString()),
        formatForMysql(a.updatedAt),
      ]
    );

    // 2) bersihkan dulu 4 tabel anak punya assessment ini (idempotent kalau di-rerun)
    await conn.query('DELETE FROM assessment_selections WHERE assessment_id = ?', [a.id]);
    await conn.query('DELETE FROM assessment_photos WHERE assessment_id = ?', [a.id]);
    await conn.query('DELETE FROM assessment_variable_scores WHERE assessment_id = ?', [a.id]);
    await conn.query('DELETE FROM assessment_criteria_subtotals WHERE assessment_id = ?', [a.id]);

    // 3) assessment_selections
    if (selections.length) {
      const placeholders = selections.map(() => '(?, ?, ?, ?)').join(', ');
      const values = [];
      selections.forEach(s => values.push(uuidv4(), a.id, s.variableId, s.selectedLevel));
      await conn.query(
        `INSERT INTO assessment_selections (id, assessment_id, variable_id, selected_level) VALUES ${placeholders}`,
        values
      );
    }

    // 4) assessment_photos
    if (photos.length) {
      const placeholders = photos.map(() => '(?, ?, ?, ?)').join(', ');
      const values = [];
      photos.forEach((url, idx) => values.push(uuidv4(), a.id, url, idx));
      await conn.query(
        `INSERT INTO assessment_photos (id, assessment_id, url, sort_order) VALUES ${placeholders}`,
        values
      );
    }

    // 5) assessment_variable_scores (dari results.details)
    if (details.length) {
      const placeholders = details.map(() => '(?, ?, ?, ?, ?)').join(', ');
      const values = [];
      details.forEach(d => values.push(uuidv4(), a.id, d.variableId, d.level, d.score));
      await conn.query(
        `INSERT INTO assessment_variable_scores (id, assessment_id, variable_id, level, score) VALUES ${placeholders}`,
        values
      );
    }

    // 6) assessment_criteria_subtotals (dari results.subtotals)
    const subtotalEntries = Object.entries(subtotals);
    if (subtotalEntries.length) {
      const placeholders = subtotalEntries.map(() => '(?, ?, ?, ?)').join(', ');
      const values = [];
      subtotalEntries.forEach(([criteriaId, subtotal]) => values.push(uuidv4(), a.id, criteriaId, subtotal));
      await conn.query(
        `INSERT INTO assessment_criteria_subtotals (id, assessment_id, criteria_id, subtotal) VALUES ${placeholders}`,
        values
      );
    }

    count++;
  }

  return count;
}

async function main() {
  if (!DB_USER || !DB_NAME) {
    throw new Error('DB_USER / DB_NAME belum diisi di .env -- wajib ada untuk konek ke mariadb.');
  }

  console.log(`Membaca sqlite dari: ${sqlitePath}`);
  const sqliteDb = new Database(sqlitePath, { readonly: true, fileMustExist: true });

  const pool = mysql.createPool({
    host: DB_HOST,
    port: DB_PORT,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
  });
  const conn = await pool.getConnection();

  try {
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');
    await applySchema(conn);
    await conn.beginTransaction();

    const summary = [];
    for (const { sqliteFile, sqlTable } of TABLE_ORDER) {
      const rows = readSqliteTable(sqliteDb, sqliteFile);
      const mapFn = mappers[sqlTable];
      const inserted = await upsertBatch(conn, sqlTable, rows, mapFn);
      summary.push({ tabel: sqlTable, baris: inserted });
      console.log(`  - ${sqlTable}: ${inserted} baris dimigrasi`);
    }

    const assessmentCount = await migrateAssessments(conn, sqliteDb);
    summary.push({ tabel: 'assessments (+ 4 tabel anak)', baris: assessmentCount });
    console.log(`  - assessments (+ 4 tabel anak): ${assessmentCount} baris dimigrasi`);

    await conn.commit();
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('\nMigrasi selesai:');
    console.table(summary);
  } catch (err) {
    await conn.rollback();
    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    console.error('Migrasi GAGAL, semua perubahan di-rollback:', err);
    process.exitCode = 1;
  } finally {
    conn.release();
    await pool.end();
    sqliteDb.close();
  }
}

main();