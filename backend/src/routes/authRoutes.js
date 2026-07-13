const router = require('express').Router();
const AuthController = require('../controllers/AuthController');

router.post('/login', (req, res, next) => AuthController.login(req, res, next));

module.exports = router;