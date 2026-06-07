const express = require('express');
const router = express.Router();
const zoneController = require('../controllers/zone.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', authenticateToken, zoneController.getAllZones);
router.get('/:id', authenticateToken, zoneController.getZoneById);

router.post('/', 
  authenticateToken, 
  authorizeRoles('administrator', 'planner'), 
  zoneController.createZone
);

router.put('/:id', 
  authenticateToken, 
  authorizeRoles('administrator', 'planner'), 
  zoneController.updateZone
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('administrator'), 
  zoneController.deleteZone
);

module.exports = router;