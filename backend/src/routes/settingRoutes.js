const router = require('express').Router();
const SettingController = require('../controllers/SettingController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.get('/:id', SettingController.get);
router.put('/:id', authMiddleware, adminMiddleware, SettingController.update);

module.exports = router;