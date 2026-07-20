/**
 * Migrasi data dari mode sqlite (id + data blob) ke mode mariadb (relasional).
 *
 * Script ini BERDIRI SENDIRI -- tidak bergantung pada DB_MODE di .env,
 * supaya bisa baca sqlite & tulis ke mariadb dalam proses yang sama tanpa
 * bentrok. Kredensial mariadb & path sqlite tetap diambil dari config/.env
 * yang sama dengan aplikasi.
 *
 * CARA PAKAI:
 *   1. Pastikan file sqlite lama masih ada (DATA_DIR/DB_FILE di .env),
 *      dan skema mariadb (migrations/schema.sql) SUDAH dijalankan lebih dulu.
 *   2. node scripts/migrate-sqlite-to-mariadb.js
 *   3. Setelah sukses, baru ubah DB_MODE=mariadb di .env dan restart app.
 *
 * Script ini aman dijalankan ulang (idempotent) -- baris yang sudah ada
 * (by id) akan di-update, bukan bikin duplikat / error.
 */

require('dotenv').config();

const path = require('path');
const Database = require('better-sqlite3');
const mysql = require('mysql2/promise');
const {
  DATA_DIR, DB_FILE,
  DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME,
} = require('./src/config');


const sqlitePath = path.join(__dirname, 'src', DATA_DIR, DB_FILE || 'web_penilaian.sqlite');

// ---------- helper baca sqlite (format lama: id + data JSON) ----------
function readSqliteTable(db, tableName) {
  const exists = db
    .prepare(`SELECT name FROM sqlite_master WHERE type='table' AND name = ?`)
    .get(tableName);
  if (!exists) return [];
  const rows = db.prepare(`SELECT data FROM "${tableName}"`).all();
  return rows.map(r => JSON.parse(r.data));
}

// ---------- helper format datetime MySQL ----------
function formatForMysql(isoString) {
    if (!isoString) return null;
    const d = new Date(isoString);
    if (isNaN(d)) return null;
    // Mengubah '2026-07-14T14:08:43.581Z' menjadi '2026-07-14 14:08:43'
    return d.toISOString().slice(0, 19).replace('T', ' ');
}

// ---------- mapping entity JS -> row SQL per tabel (samakan dgn repositories/*.js) ----------
const mappers = {
  teams: (t) => ({
    columns: ['id', 'name'],
    values: [t.id, t.name],
  }),
  users: (u) => ({
    columns: ['id', 'name', 'username', 'password', 'role', 'team_id', 'active_token', 'password_reset_at', 'password_reset_by'],
    // Gunakan formatForMysql pada passwordResetAt
    values: [u.id, u.name, u.username, u.password, u.role, u.teamId ?? null, u.activeToken ?? null, formatForMysql(u.passwordResetAt), u.passwordResetBy ?? null],
  }),
  groups: (g) => ({
    columns: ['id', 'name', 'gugus', 'team_id'],
    values: [g.id, g.name, g.gugus, g.teamId ?? null],
  }),
  sessions: (s) => ({
    columns: ['id', 'name', 'description', 'created_at'],
    // Gunakan formatForMysql pada createdAt
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
  assessments: (a) => ({
    columns: ['id', 'user_id', 'group_id', 'session_id', 'selections_json', 'photos_json', 'recommendation', 'results_json', 'created_at', 'updated_at'],
    values: [
      a.id, a.userId, a.groupId, a.sessionId,
      JSON.stringify(a.selections || []),
      JSON.stringify(a.photos || []),
      a.recommendation || '',
      JSON.stringify(a.results || {}),
      // Gunakan formatForMysql pada createdAt dan updatedAt
      formatForMysql(a.createdAt) || formatForMysql(new Date().toISOString()),
      formatForMysql(a.updatedAt),
    ],
  }),
};

// Urutan WAJIB sesuai dependency FK: parent dulu baru child.
// filename sqlite lama -> nama tabel sql baru
const TABLE_ORDER = [
  { sqliteFile: 'teams',       sqlTable: 'teams' },
  { sqliteFile: 'users',       sqlTable: 'users' },
  { sqliteFile: 'groups',      sqlTable: 'groups' },
  { sqliteFile: 'sessions',    sqlTable: 'sessions' },
  { sqliteFile: 'tables',      sqlTable: 'assessment_tables' }, // nama file lama "tables", tabel sql baru "assessment_tables"
  { sqliteFile: 'criteria',    sqlTable: 'criteria' },
  { sqliteFile: 'variables',   sqlTable: 'variables' },
  { sqliteFile: 'assessments', sqlTable: 'assessments' },
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
    await conn.beginTransaction();

    const summary = [];
    for (const { sqliteFile, sqlTable } of TABLE_ORDER) {
      const rows = readSqliteTable(sqliteDb, sqliteFile);
      const mapFn = mappers[sqlTable];
      const inserted = await upsertBatch(conn, sqlTable, rows, mapFn);
      summary.push({ tabel: sqlTable, baris: inserted });
      console.log(`  - ${sqlTable}: ${inserted} baris dimigrasi`);
    }

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