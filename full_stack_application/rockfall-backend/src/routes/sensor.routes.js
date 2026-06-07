const express = require('express');
const router = express.Router();
const sensorController = require('../controllers/sensor.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', authenticateToken, sensorController.getAllSensors);
router.get('/:id', authenticateToken, sensorController.getSensorById);

router.post('/', 
  authenticateToken, 
  authorizeRoles('administrator'), 
  sensorController.createSensor
);

router.put('/:id', 
  authenticateToken, 
  authorizeRoles('administrator'), 
  sensorController.updateSensor
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('administrator'), 
  sensorController.deleteSensor
);

module.exports = router;
