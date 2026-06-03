const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.post(
  '/generate',
  authenticateToken,
  authorizeRoles('administrator', 'planner'),
  reportController.generateReport
);

module.exports = router;