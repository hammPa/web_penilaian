const router = require('express').Router();
const TeamController = require('../controllers/TeamController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

router.use(authMiddleware);
router.get('/', TeamController.getAll);
router.get('/:id', TeamController.getById);

router.post('/', adminMiddleware, TeamController.create);
router.put('/:id', adminMiddleware, TeamController.update);
router.delete('/:id', adminMiddleware, TeamController.delete);

module.exports = router;