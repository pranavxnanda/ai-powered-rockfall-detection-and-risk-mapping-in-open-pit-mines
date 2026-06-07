const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/', 
  authenticateToken, 
  authorizeRoles('administrator'), 
  userController.getAllUsers
);

router.get('/assignable', 
  authenticateToken, 
  authorizeRoles('administrator', 'planner'), 
  userController.getAssignableUsers
);

router.get('/:id', authenticateToken, userController.getUserById);

router.put('/:id', 
  authenticateToken, 
  userController.updateUser
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('administrator'), 
  userController.deleteUser
);

module.exports = router;