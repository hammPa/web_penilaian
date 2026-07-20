const mysql = require('mysql2/promise');
const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = require('./index');

if (!DB_USER || !DB_NAME) {
  throw new Error(
    'DB_MODE=mariadb tapi DB_USER/DB_NAME belum diisi di .env. ' +
    'Cek DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME.'
  );
}

// Pool, bukan single connection -- supaya request paralel (banyak user
// akses bersamaan) tidak rebutan satu koneksi yang sama.
const pool = mysql.createPool({
  host: DB_HOST,
  port: DB_PORT,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true, // biar DATETIME balik sebagai string, konsisten dgn ISO string di mode json/sqlite
});

module.exports = pool;