const express = require('express');
const router = express.Router();
const incidentController = require('../controllers/incident.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', authenticateToken, incidentController.getAllIncidents);
router.get('/stats/monthly', authenticateToken, incidentController.getMonthlyStats);
router.get('/stats/daily-risk', authenticateToken, incidentController.getDailyRiskTrend);

router.get('/:id', authenticateToken, incidentController.getIncidentById);

router.post('/', authenticateToken, incidentController.createIncident);

router.put('/:id', 
  authenticateToken, 
  authorizeRoles('administrator', 'planner'), 
  incidentController.updateIncident
);

module.exports = router;