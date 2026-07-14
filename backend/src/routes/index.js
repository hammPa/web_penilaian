const router = require('express').Router();
const authRoutes = require('./authRoutes');
const sessionRoutes = require('./sessionRoutes');
const tableRoutes = require('./tableRoutes');
const criteriaRoutes = require('./criteriaRoutes');
const variableRoutes = require('./variableRoutes');
const assessmentRoutes = require('./assessmentRoutes');
const teamRoutes = require('./teamRoutes');
const groupRoutes = require('./groupRoutes');
const userRoutes = require('./userRoutes');
const uploadRoutes = require('./uploadRoutes');

router.use('/auth', authRoutes);
router.use('/sessions', sessionRoutes);
router.use('/tables', tableRoutes);
router.use('/criteria', criteriaRoutes);
router.use('/variables', variableRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/teams', teamRoutes);
router.use('/groups', groupRoutes);
router.use('/users', userRoutes);
router.use('/upload', uploadRoutes);

module.exports = router;