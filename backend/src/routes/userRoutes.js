const router = require('express').Router();
const UserController = require('../controllers/UserController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Semua rute user membutuhkan autentikasi dan akses admin
router.use(authMiddleware);
router.use(adminMiddleware);

router.get('/', (req, res, next) => UserController.getAll(req, res, next));
router.get('/:id', (req, res, next) => UserController.getById(req, res, next));
router.post('/', (req, res, next) => UserController.create(req, res, next));
router.put('/:id', (req, res, next) => UserController.update(req, res, next));
router.put('/:id/reset-password', (req, res, next) => UserController.resetPassword(req, res, next));
router.delete('/:id', (req, res, next) => UserController.delete(req, res, next));

module.exports = router;