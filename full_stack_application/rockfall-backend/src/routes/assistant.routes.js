const express = require('express');
const router = express.Router();
const assistantController = require('../controllers/assistant.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

router.post('/chat', authenticateToken, assistantController.chat);
router.get('/history', authenticateToken, assistantController.getHistory);
router.post('/end-conversation', authenticateToken, assistantController.endConversation);

module.exports = router;