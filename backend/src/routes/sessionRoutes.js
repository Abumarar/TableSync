const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Public: Request session
router.post('/request', sessionController.requestSession);
router.get('/table/:tableId', sessionController.getSessionByTable);

// Staff Protected: Approve/Close
router.get('/', authenticateToken, authorizeRole(['staff', 'admin']), sessionController.getSessions);
router.post('/:sessionId/approve', authenticateToken, authorizeRole(['staff', 'admin']), sessionController.approveSession);
router.post('/:sessionId/close', authenticateToken, authorizeRole(['staff', 'admin']), sessionController.closeSession);

module.exports = router;
