const router = require('express').Router();
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/login', (req, res, next) => AuthController.login(req, res, next));
router.get('/me', authMiddleware, (req, res, next) => AuthController.me(req, res, next));

module.exports = router;