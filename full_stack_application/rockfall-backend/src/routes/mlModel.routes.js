const express = require('express');
const router = express.Router();
const mlModelController = require('../controllers/mlModel.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');


router.post(
  '/fetch',
  authenticateToken,
  authorizeRoles('administrator'),
  mlModelController.triggerMLFetch
);


router.get(
  '/status',
  authenticateToken,
  authorizeRoles('administrator'),
  mlModelController.getMLStatus
);

module.exports = router;