const express = require('express');
const router = express.Router();
const assignmentController = require('../controllers/assignment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');
const { authorizeRoles } = require('../middleware/role.middleware');

router.get('/my', authenticateToken, assignmentController.getMyAssignments);

router.get('/', 
  authenticateToken, 
  authorizeRoles('administrator', 'planner'), 
  assignmentController.getAllAssignments
);

router.post('/', 
  authenticateToken, 
  authorizeRoles('administrator', 'planner'), 
  assignmentController.createAssignment
);

router.put('/:id', 
  authenticateToken, 
  authorizeRoles('administrator', 'planner'), 
  assignmentController.updateAssignment
);

router.delete('/:id', 
  authenticateToken, 
  authorizeRoles('administrator', 'planner'), 
  assignmentController.deleteAssignment
);

module.exports = router;