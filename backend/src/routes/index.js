const router = require('express').Router();
const authRoutes = require('./authRoutes');
const tableRoutes = require('./tableRoutes');
const criteriaRoutes = require('./criteriaRoutes');
const variableRoutes = require('./variableRoutes');
const assessmentRoutes = require('./assessmentRoutes');

router.use('/auth', authRoutes);
router.use('/tables', tableRoutes);
router.use('/criteria', criteriaRoutes);
router.use('/variables', variableRoutes);
router.use('/assessments', assessmentRoutes);

module.exports = router;