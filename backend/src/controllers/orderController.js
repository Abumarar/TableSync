const db = require('../config/database');
const socketService = require('../services/socketService');

// Place Order (Customer)
const placeOrder = async (req, res) => {
    // Check if user has session token (from auth middleware)
    const sessionUser = req.user;
    if (!sessionUser || sessionUser.role !== 'customer') {
        return res.status(403).json({ message: 'Customer session required' });
    }

    const { items, notes } = req.body; // items: [{ productId, quantity, notes }]
    const sessionId = sessionUser.sessionId;

    try {
        // Verify session is active
        const sessionRes = await db.query("SELECT * FROM sessions WHERE id = $1 AND status = 'active'", [sessionId]);
        if (sessionRes.rows.length === 0) {
            return res.status(400).json({ message: 'Session is not active' });
        }
        const session = sessionRes.rows[0];

        // Calculate total and create order
        let totalAmount = 0;

        // We need to fetch product prices to be secure (don't trust client price)
        // Optimization: fetch all product IDs in one query
        const productIds = items.map(i => i.productId);
        const productsRes = await db.query("SELECT * FROM products WHERE id = ANY($1)", [productIds]);
        const productsMap = {};
        productsRes.rows.forEach(p => productsMap[p.id] = p);

        // Validate items
        for (const item of items) {
            if (!productsMap[item.productId]) {
                return res.status(400).json({ message: `Product ${item.productId} not found` });
            }
            totalAmount += parseFloat(productsMap[item.productId].price) * item.quantity;
        }

        // Begin Transaction
        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            const orderRes = await client.query(
                "INSERT INTO orders (session_id, status, total_amount) VALUES ($1, 'pending', $2) RETURNING *",
                [sessionId, totalAmount]
            );
            const order = orderRes.rows[0];

            // Insert Order Items
            for (const item of items) {
                const product = productsMap[item.productId];
                await client.query(
                    "INSERT INTO order_items (order_id, product_id, quantity, price_at_time, notes) VALUES ($1, $2, $3, $4, $5)",
                    [order.id, item.productId, item.quantity, product.price, item.notes || '']
                );
            }

            await client.query('COMMIT');

            // Fetch full order details for socket emitting
            const fullOrder = {
                ...order,
                table_id: session.table_id,
                customer_name: session.customer_name,
                items: items.map(i => ({ ...i, producName: productsMap[i.productId].name }))
            };

            // Notify Staff and Kitchen
            socketService.emitToStaff('staff:new_order', fullOrder);
            socketService.emitToKitchen('kitchen:new_order', fullOrder);

            res.status(201).json(fullOrder);

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error placing order' });
    }
};

// Get Orders (Staff/Kitchen)
const getOrders = async (req, res) => {
    const { status } = req.query;
    try {
        let query = `
      SELECT o.*, s.table_id, s.customer_name,
      json_agg(json_build_object(
        'id', oi.id, 
        'producName', p.name, 
        'quantity', oi.quantity, 
        'notes', oi.notes
      )) as items
      FROM orders o
      JOIN sessions s ON o.session_id = s.id
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
    `;

        // Filter by status if provided
        // status can be comma separated list e.g. "pending,preparing"
        const values = [];
        if (status) {
            // Handle both comma-separated string and array (if extended query parser usage changes)
            const statuses = Array.isArray(status) ? status : status.split(',');
            query += ` WHERE o.status = ANY($1)`;
            values.push(statuses);
        }

        query += ` GROUP BY o.id, s.table_id, s.customer_name ORDER BY o.created_at ASC`;

        const result = await db.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

// Update Order Status
const updateOrderStatus = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;

    try {
        const result = await db.query(
            "UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *",
            [status, orderId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const order = result.rows[0];

        // Notify Table
        // Need to get table ID
        const sessionRes = await db.query("SELECT table_id FROM sessions WHERE id = $1", [order.session_id]);
        if (sessionRes.rows.length > 0) {
            const tableId = sessionRes.rows[0].table_id;
            socketService.emitToTable(tableId, `table_${tableId}:order_update`, {
                orderId: order.id,
                status: order.status
            });
        }

        // Notify Staff/Kitchen (sync state)
        socketService.emitToStaff('staff:order_update', { orderId: order.id, status: order.status });
        socketService.emitToKitchen('kitchen:order_update', { orderId: order.id, status: order.status });

        res.json(order);

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error updating order' });
    }
};

// Get Orders for a specific session (Public/Customer)
const getSessionOrders = async (req, res) => {
    const { sessionId } = req.params;
    try {
        const query = `
      SELECT o.*, 
      json_agg(json_build_object(
        'id', oi.id, 
        'name', p.name, 
        'quantity', oi.quantity, 
        'notes', oi.notes,
        'price', oi.price_at_time
      )) as items
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN products p ON oi.product_id = p.id
      WHERE o.session_id = $1
      GROUP BY o.id
      ORDER BY o.created_at DESC
    `;
        const result = await db.query(query, [sessionId]);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching session orders' });
    }
};

module.exports = {
    placeOrder,
    getOrders,
    updateOrderStatus,
    getSessionOrders
};
