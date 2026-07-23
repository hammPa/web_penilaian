/**
 * Resolve URL foto assessment supaya kompatibel dengan 2 kondisi:
 * 1. Foto LAMA (diupload sebelum migrasi) -- masih path relatif, mis. "/uploads/doc-123.jpg"
 *    -> perlu digabung manual dengan baseUrl (URL backend)
 * 2. Foto BARU (Cloudinary / Hostinger FTP) -- sudah full URL,
 *    mis. "https://res.cloudinary.com/..." atau "https://domainkamu.com/uploads/doc-123.jpg"
 *    -> dipakai apa adanya, JANGAN digabung lagi (kalau digabung jadi rusak)
 */
export function resolvePhotoUrl(url, baseUrl) {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url; // sudah full URL
  return `${baseUrl}${url}`; // fallback: path lokal lama
}