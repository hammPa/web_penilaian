const router = require('express').Router();
const CriteriaController = require('../controllers/CriteriaController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);
router.get('/', (req, res, next) => CriteriaController.getAll(req, res, next));
router.get('/:id', (req, res, next) => CriteriaController.getById(req, res, next));
router.post('/', adminMiddleware, (req, res, next) => CriteriaController.create(req, res, next));
router.put('/:id', adminMiddleware, (req, res, next) => CriteriaController.update(req, res, next));
router.delete('/:id', adminMiddleware, (req, res, next) => CriteriaController.delete(req, res, next));

module.exports = router;