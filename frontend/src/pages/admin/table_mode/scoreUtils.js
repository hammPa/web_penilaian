// "Nilai" sebuah kriteria = (bobot variabel) x (level tertinggi yang deskripsinya sudah diisi).
// Contoh: level 0,1,3,5 terisi -> level tertinggi = 5. Level 0,1,2 terisi -> level tertinggi = 2.
// Belum ada yang diisi -> level tertinggi = 0.
//
// Sel yang isinya cuma tanda dash ("-", "–", "—") dianggap SAMA DENGAN kosong/
// tidak terisi (biasanya berasal dari paste spreadsheet sumber yang memakai "-"
// untuk menandai "level ini tidak dipakai"), walau di database tetap tersimpan
// sebagai string tanda dash tersebut, bukan string kosong.
function isEmptyOrDash(text) {
  if (!text) return true;
  const trimmed = text.trim();
  if (trimmed === '') return true;
  // hanya berisi karakter dash (satu atau lebih, boleh diapit spasi)
  return /^[-–—]+$/.test(trimmed);
}

export function getFilledMaxLevel(config) {
  if (!config?.variables) return 0;
  let maxLevel = 0;
  config.variables.forEach((v, idx) => {
    if (!isEmptyOrDash(v?.description)) {
      maxLevel = Math.max(maxLevel, idx);
    }
  });
  return maxLevel;
}

export function getKriteriaNilai(config) {
  if (!config) return 0;
  const maxLevel = getFilledMaxLevel(config);
  return (config.weight || 0) * maxLevel;
}