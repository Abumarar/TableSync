const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Get all tables (Protected: Staff/Admin)
router.get('/', authenticateToken, authorizeRole(['staff', 'admin']), tableController.getTables);

module.exports = router;
