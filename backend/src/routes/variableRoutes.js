const router = require('express').Router();
const VariableController = require('../controllers/VariableController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);
router.get('/', (req, res, next) => VariableController.getAll(req, res, next));
router.get('/:id', (req, res, next) => VariableController.getById(req, res, next));
router.post('/', adminMiddleware, (req, res, next) => VariableController.create(req, res, next));
router.put('/:id', adminMiddleware, (req, res, next) => VariableController.update(req, res, next));
router.delete('/:id', adminMiddleware, (req, res, next) => VariableController.delete(req, res, next));

module.exports = router;