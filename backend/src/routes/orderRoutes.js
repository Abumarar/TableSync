const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

// Place order (Customer with Session Token)
router.post('/', authenticateToken, orderController.placeOrder);

// Get orders (Staff/Kitchen)
router.get('/', authenticateToken, authorizeRole(['staff', 'kitchen', 'admin']), orderController.getOrders);

// Update status (Staff/Kitchen)
router.patch('/:orderId/status', authenticateToken, authorizeRole(['staff', 'kitchen', 'admin']), orderController.updateOrderStatus);

// Get orders by session (Customer)
router.get('/session/:sessionId', orderController.getSessionOrders);

module.exports = router;
