/**
 * PENTING: Jalankan sekali sebelum deploy versi bcrypt ini, kalau tidak
 * semua user existing (password masih plaintext) TIDAK BISA LOGIN lagi,
 * karena bcrypt.compare() akan selalu gagal membandingkan plaintext lawan
 * hash.
 *
 * Jalankan: node migrate-hash-passwords.js
 * Backup otomatis dibuat sebagai users.json.bak sebelum menimpa file asli.
 */
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'src/data'); // sesuaikan kalau path data-mu beda
const usersPath = path.join(DATA_DIR, 'users.json');
const SALT_ROUNDS = 10;

async function migrate() {
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

  fs.writeFileSync(usersPath + '.bak', JSON.stringify(users, null, 2));

  let migratedCount = 0;
  const newUsers = [];

  for (const user of users) {
    // Deteksi sudah di-hash atau belum: hash bcrypt selalu diawali $2a$/$2b$/$2y$
    const alreadyHashed = typeof user.password === 'string' && /^\$2[aby]\$/.test(user.password);
    if (alreadyHashed) {
      newUsers.push(user);
      continue;
    }
    const hashed = await bcrypt.hash(user.password, SALT_ROUNDS);
    newUsers.push({ ...user, password: hashed });
    migratedCount++;
  }

  fs.writeFileSync(usersPath, JSON.stringify(newUsers, null, 2));
  console.log(`Migrasi selesai. ${migratedCount} dari ${users.length} user di-hash ulang.`);
}

migrate().catch((err) => {
  console.error('Migrasi gagal:', err);
  process.exit(1);
});