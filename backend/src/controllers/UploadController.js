const ftp = require('basic-ftp');
const sharp = require('sharp');
const { Readable } = require('stream');
const { v4: uuidv4 } = require('uuid');
const { success } = require('../utils/responseFormatter');

// Kredensial & path diambil dari .env -- JANGAN hardcode.
// Wajib set di .env:
//   FTP_HOST=ftp.domainkamu.com     (atau IP FTP dari hPanel Hostinger)
//   FTP_USER=xxxxx
//   FTP_PASSWORD=xxxxx
//   FTP_UPLOAD_DIR=/public_html/uploads   (path folder tujuan di Hostinger)
//   PUBLIC_BASE_URL=https://domainkamu.com/uploads  (URL publik utk folder itu)
const FTP_CONFIG = {
  host: process.env.FTP_HOST,
  user: process.env.FTP_USER,
  password: process.env.FTP_PASSWORD,
  secure: false, // Hostinger shared hosting umumnya FTP biasa (port 21).
                 // Kalau hPanel kasih opsi FTPS, ganti ke true.
};

const FTP_UPLOAD_DIR = process.env.FTP_UPLOAD_DIR || '/public_html/uploads';
const PUBLIC_BASE_URL = (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, '');

class UploadController {
  async uploadPhotos(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return success(res, [], 'Tidak ada file diupload');
      }

      const uploadedUrls = [];
      const client = new ftp.Client();
      client.ftp.verbose = false;

      try {
        await client.access(FTP_CONFIG);
        await client.ensureDir(FTP_UPLOAD_DIR); // pindah + bikin folder kalau belum ada

        for (const file of req.files) {
          // Kompresi dulu di memory (SAMA seperti sebelumnya), supaya file
          // yang dikirim ke Hostinger lebih kecil -- hemat kuota disk shared hosting.
          const compressedBuffer = await sharp(file.buffer)
            .resize({ width: 1280, withoutEnlargement: true })
            .jpeg({ quality: 70 })
            .toBuffer();

          const filename = `doc-${uuidv4()}.jpg`;
          await client.uploadFrom(Readable.from(compressedBuffer), filename);

          uploadedUrls.push(`${PUBLIC_BASE_URL}/${filename}`);
        }
      } finally {
        client.close();
      }

      // Tetap array of URL string, sama seperti versi lokal/Cloudinary --
      // Repository/Service tidak perlu diubah.
      success(res, uploadedUrls, 'Foto berhasil diunggah', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UploadController();