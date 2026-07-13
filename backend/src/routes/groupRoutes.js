const router = require('express').Router();
const GroupController = require('../controllers/GroupController');

// Ingat: Jika masih tahap testing, jangan panggil middleware auth dulu
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);
router.get('/', GroupController.getAll);
router.get('/:id', GroupController.getById);

router.post('/', adminMiddleware, GroupController.create);
router.put('/:id', adminMiddleware, GroupController.update);
router.delete('/:id', adminMiddleware, GroupController.delete);

module.exports = router;