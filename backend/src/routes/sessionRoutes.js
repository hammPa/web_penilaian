const router = require('express').Router();
const SessionController = require('../controllers/SessionController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);
router.get('/', (req, res, next) => SessionController.getAll(req, res, next));
router.get('/:id', (req, res, next) => SessionController.getById(req, res, next));
router.post('/', adminMiddleware, (req, res, next) => SessionController.create(req, res, next));
router.put('/:id', adminMiddleware, (req, res, next) => SessionController.update(req, res, next));
router.delete('/:id', adminMiddleware, (req, res, next) => SessionController.delete(req, res, next));
router.post('/:id/duplicate', adminMiddleware, (req, res, next) => SessionController.duplicate(req, res, next));

module.exports = router;