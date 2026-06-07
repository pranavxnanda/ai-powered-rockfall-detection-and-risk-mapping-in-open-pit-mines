const express = require('express');
const router = express.Router();
const alertController = require('../controllers/alert.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/my', authenticateToken, alertController.getMyAlerts);

router.get('/', 
  authenticateToken, 
  authorizeRoles('administrator', 'planner'), 
  alertController.getAllAlerts
);

router.post('/', 
  authenticateToken, 
  authorizeRoles('administrator'), 
  alertController.createAlert
);

router.post('/:id/acknowledge', 
  authenticateToken, 
  alertController.acknowledgeAlert
);

module.exports = router;