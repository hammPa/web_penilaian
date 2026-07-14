const router = require('express').Router();
const multer = require('multer');
const UploadController = require('../controllers/UploadController');
const authMiddleware = require('../middleware/authMiddleware');

// Gunakan memoryStorage agar Sharp bisa membaca buffer-nya sebelum disave
const upload = multer({ storage: multer.memoryStorage() });

router.use(authMiddleware);
// Izinkan maksimal 20 foto sekali upload (bisa disesuaikan)
router.post('/', upload.array('photos', 20), (req, res, next) => UploadController.uploadPhotos(req, res, next));

module.exports = router;