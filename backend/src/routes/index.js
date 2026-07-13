const router = require('express').Router();
const authRoutes = require('./authRoutes');
const tableRoutes = require('./tableRoutes');
const criteriaRoutes = require('./criteriaRoutes');
const variableRoutes = require('./variableRoutes');
const assessmentRoutes = require('./assessmentRoutes');
const userRoutes = require('./userRoutes');
const teamRoutes = require('./teamRoutes');
const groupRoutes = require('./groupRoutes');

router.use('/auth', authRoutes);
router.use('/tables', tableRoutes);
router.use('/criteria', criteriaRoutes);
router.use('/variables', variableRoutes);
router.use('/assessments', assessmentRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/groups', groupRoutes);

module.exports = router;