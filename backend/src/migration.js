const fs = require('fs');
const path = require('path');

// Sesuaikan path ke file JSON kamu
const tablesPath = path.join(__dirname, 'data/tables.json'); // atau 'data/tables.json'
const sessionsPath = path.join(__dirname, 'data/sessions.json');

// 1. Ambil session pertama sebagai default
const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
if (sessions.length === 0) {
    console.log("Buat minimal 1 sesi dulu dari Frontend!");
    process.exit(1);
}
const defaultSessionId = sessions[0].id; // Ambil ID Sesi yang paling awal dibuat

// 2. Update tables.json
const tables = JSON.parse(fs.readFileSync(tablesPath, 'utf8'));
let migratedCount = 0;

const updatedTables = tables.map(table => {
    if (!table.sessionId) {
        migratedCount++;
        return { ...table, sessionId: defaultSessionId };
    }
    return table;
});

// 3. Simpan kembali
fs.writeFileSync(tablesPath, JSON.stringify(updatedTables, null, 2));
console.log(`Berhasil memigrasi ${migratedCount} tabel ke Sesi: ${sessions[0].name}`);