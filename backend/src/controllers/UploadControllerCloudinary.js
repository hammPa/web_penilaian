const cloudinary = require('cloudinary').v2;
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const { success } = require('../utils/responseFormatter');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: upload satu buffer ke Cloudinary lewat stream (tidak nyentuh disk sama sekali)
function uploadBufferToCloudinary(buffer, publicId) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'assessment-photos', // biar rapi, semua foto assessment masuk 1 folder di Cloudinary
        public_id: publicId,
        resource_type: 'image',
        overwrite: false,
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result);
      }
    );
    uploadStream.end(buffer);
  });
}

class UploadController {
  async uploadPhotos(req, res, next) {
    try {
      if (!req.files || req.files.length === 0) {
        return success(res, [], 'Tidak ada file diupload');
      }

      const uploadedUrls = [];

      // Loop semua file yang dikirim
      for (const file of req.files) {
        // Kompresi dulu di memory pakai Sharp (SAMA seperti sebelumnya) --
        // supaya file yang dikirim ke Cloudinary sudah kecil, hemat kuota
        // storage & bandwidth free tier.
        const compressedBuffer = await sharp(file.buffer)
          .resize({ width: 1280, withoutEnlargement: true }) // Max lebar 1280px
          .jpeg({ quality: 70 }) // Kualitas 70%
          .toBuffer();

        const publicId = `doc-${uuidv4()}`;
        const result = await uploadBufferToCloudinary(compressedBuffer, publicId);

        // secure_url = URL https permanen dari Cloudinary, inilah yang
        // disimpan ke field `photos` (tetap array of string URL, format
        // yang sama seperti sebelumnya -- Repository/Service tidak berubah)
        uploadedUrls.push(result.secure_url);
      }

      success(res, uploadedUrls, 'Foto berhasil diunggah', 201);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new UploadController();