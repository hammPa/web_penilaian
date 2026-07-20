module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  DATA_DIR: 'data',

  // mode = json | sqlite | mariadb
  DB_MODE: process.env.DB_MODE || 'json',

  // hanya dipakai kalau DB_MODE=sqlite, disimpan di dalam folder DATA_DIR
  DB_FILE: process.env.DB_FILE || 'web_penilaian.sqlite',

  // hanya dipakai kalau DB_MODE=mariadb / mysql
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
  DB_USER: process.env.DB_USER,
  DB_PASSWORD: process.env.DB_PASSWORD,
  DB_NAME: process.env.DB_NAME,
};