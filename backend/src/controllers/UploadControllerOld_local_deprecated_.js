const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { success } = require('../utils/responseFormatter');

// Pastikan folder uploads ada
const uploadDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

class UploadController {
  async uploadPhotos(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return success(res, [], 'Tidak ada file diupload');
      }

      const uploadedPaths = [];

      // Loop semua file yang dikirim
      for (const file of req.files) {
        const filename = `doc-${uuidv4()}.jpg`; // Nama file unik
        const filepath = path.join(uploadDir, filename);

        // Kompresi menggunakan Sharp
        await sharp(file.buffer)
          .resize({ width: 1280, withoutEnlargement: true }) // Max lebar 1280px
          .jpeg({ quality: 70 }) // Kualitas 70% (ukuran file akan turun drastis)
          .toFile(filepath);

        // Simpan path yang bisa diakses dari frontend nanti
        uploadedPaths.push(`/uploads/${filename}`);
      }

      // Kembalikan array path gambar ke frontend
      success(res, uploadedPaths, 'Foto berhasil diunggah', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UploadController();