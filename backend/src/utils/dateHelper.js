/**
 * Konversi ISO 8601 string (mis. "2026-07-20T10:30:00.000Z") ke format
 * DATETIME MySQL/MariaDB ("2026-07-20 10:30:00"), dan sebaliknya.
 *
 * mysql2 hanya auto-convert object `Date` JS ke format DATETIME yang valid;
 * kalau yang dikirim adalah string ISO biasa, ia dikirim mentah-mentah ke
 * query dan MariaDB akan menolaknya dengan error:
 *   "Incorrect datetime value: '...' for column '...'"
 * karena format ISO pakai 'T' sebagai pemisah tanggal/jam, ada milidetik,
 * dan diakhiri 'Z' -- semuanya tidak dikenali DATETIME.
 *
 * Kedua fungsi ini dipanggil di layer Repository (toRow/fromRow), bukan di
 * Service, supaya Service tetap bebas bekerja dengan ISO string seperti
 * biasa (dipakai juga untuk sorting & perbandingan tanggal di mode
 * json/sqlite).
 */
function toMysqlDatetime(isoString) {
  if (!isoString) return null;

  const d = new Date(isoString);
  if (isNaN(d.getTime())) return null; // jaga-jaga kalau string tidak valid

  // "2026-07-20T10:30:00.000Z" -> "2026-07-20 10:30:00"
  return d.toISOString().slice(0, 19).replace('T', ' ');
}

/**
 * Kebalikan dari toMysqlDatetime(). PENTING: kolom DATETIME di MariaDB
 * tidak menyimpan info timezone -- ia cuma angka mentah. Karena
 * toMysqlDatetime() menulis dalam representasi UTC, waktu baca balik
 * WAJIB dianggap UTC juga (ditandai 'Z'), supaya tidak salah
 * diinterpretasikan sebagai waktu lokal server saat nanti di-parse ulang
 * dengan `new Date(...)` (mis. buat sorting di SessionService).
 *
 * "2026-07-20 10:30:00" -> "2026-07-20T10:30:00.000Z"
 */
function fromMysqlDatetime(mysqlString) {
  if (!mysqlString) return null;

  const iso = new Date(mysqlString.replace(' ', 'T') + 'Z');
  if (isNaN(iso.getTime())) return null;

  return iso.toISOString();
}

module.exports = { toMysqlDatetime, fromMysqlDatetime };