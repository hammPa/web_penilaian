const router = require('express').Router();
const AssessmentController = require('../controllers/AssessmentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);
router.post('/', (req, res, next) => AssessmentController.create(req, res, next));
router.get('/', (req, res, next) => AssessmentController.getAll(req, res, next));
router.get('/:id', (req, res, next) => AssessmentController.getById(req, res, next));
router.put('/:id', (req, res, next) => AssessmentController.update(req, res, next));
router.delete('/:id', (req, res, next) => AssessmentController.delete(req, res, next));

module.exports = router;