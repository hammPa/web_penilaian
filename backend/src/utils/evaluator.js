/**
 * Mengevaluasi string formula dengan aman.
 * Formula dapat berupa ekspresi yang menggunakan variabel:
 * - bobot (weight dari kriteria)
 * - skor (0 atau 1 berdasarkan pilihan user)
 * 
 * Contoh formula: "bobot * skor", "skor === 1 ? 10 : 0", "bobot * skor + 2"
 * 
 * @param {string} formula - Ekspresi matematika/logika
 * @param {object} context - { bobot, skor }
 * @returns {number} Hasil evaluasi
 */
function evaluateFormula(formula, context) {
  // Hanya izinkan akses ke properti yang diberikan
  const sandbox = { ...context };
  // Buat fungsi dengan parameter sesuai nama properti context
  const keys = Object.keys(sandbox);
  const values = Object.values(sandbox);
  
  // Fungsi anonim yang mengeksekusi formula sebagai ekspresi return
  const func = new Function(...keys, `'use strict'; return (${formula});`);
  
  try {
    const result = func(...values);
    // Pastikan hasil adalah angka
    if (typeof result === 'number' && !isNaN(result)) {
      return result;
    }
    return 0; // fallback jika bukan angka
  } catch (err) {
    console.error('Formula evaluation error:', err.message);
    return 0;
  }
}

module.exports = { evaluateFormula };