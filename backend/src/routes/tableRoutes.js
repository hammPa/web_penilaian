const router = require('express').Router();
const TableController = require('../controllers/TableController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);
router.get('/', (req, res, next) => TableController.getAll(req, res, next));
router.get('/:id', (req, res, next) => TableController.getById(req, res, next));
router.post('/', adminMiddleware, (req, res, next) => TableController.create(req, res, next));
router.put('/:id', adminMiddleware, (req, res, next) => TableController.update(req, res, next));
router.delete('/:id', adminMiddleware, (req, res, next) => TableController.delete(req, res, next));

module.exports = router;