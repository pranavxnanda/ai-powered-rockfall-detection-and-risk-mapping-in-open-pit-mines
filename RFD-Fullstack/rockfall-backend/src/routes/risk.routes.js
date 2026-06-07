const express = require('express');
const router = express.Router();
const riskController = require('../controllers/risk.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', authenticateToken, riskController.getAllRisks);
router.get('/latest', authenticateToken, riskController.getLatestRisks);

router.post('/', 
  authenticateToken, 
  authorizeRoles('administrator'), 
  riskController.createRiskAssessment
);

module.exports = router;