const db = require('../config/database');
const socketService = require('../services/socketService');
const jwt = require('jsonwebtoken');

// Request a new session
const requestSession = async (req, res) => {
    const { tableId, customerName } = req.body;
    console.log(`[SessionRequest] Received request: Table ${tableId}, Name: ${customerName}`);

    try {
        // Check if there is already an active session for this table
        const existingSession = await db.query(
            "SELECT * FROM sessions WHERE table_id = $1 AND status IN ('pending', 'active')",
            [tableId]
        );

        if (existingSession.rows.length > 0) {
            const session = existingSession.rows[0];
            console.log(`[SessionRequest] Found existing session: ${session.id} (${session.status})`);

            // If session is active, block new request (Exclusivity)
            if (session.status === 'active') {
                return res.status(409).json({ message: 'Table is currently occupied. Please wait for the current session to end.' });
            }

            // Re-notify staff if pending (allow re-requesting/joining pending session for simplicity/retries)
            if (session.status === 'pending') {
                socketService.emitToStaff('staff:new_request', {
                    sessionId: session.id,
                    tableId: session.table_id,
                    customerName: session.customer_name,
                    status: 'pending'
                });
            }

            return res.status(200).json(session);
        }

        // Create pending session
        const result = await db.query(
            "INSERT INTO sessions (table_id, customer_name, status) VALUES ($1, $2, 'pending') RETURNING *",
            [tableId, customerName]
        );
        const session = result.rows[0];

        // Notify Staff
        socketService.emitToStaff('staff:new_request', {
            sessionId: session.id,
            tableId,
            customerName,
            status: 'pending'
        });

        res.status(201).json(session);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error requesting session' });
    }
};

// Approve a session
const approveSession = async (req, res) => {
    const { sessionId } = req.params;

    try {
        const result = await db.query(
            "UPDATE sessions SET status = 'active', start_time = NOW() WHERE id = $1 RETURNING *",
            [sessionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const session = result.rows[0];

        // Update table current_session_id
        await db.query('UPDATE tables SET current_session_id = $1 WHERE id = $2', [session.id, session.table_id]);

        // Generate Session Token for Customer
        const token = jwt.sign(
            { sessionId: session.id, tableId: session.table_id, role: 'customer' },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '2h' }
        );

        // Notify Table (Customer)
        socketService.emitToTable(session.table_id, `table_${session.table_id}:session_approved`, {
            token,
            status: 'active'
        });

        // Notify Staff
        socketService.emitToStaff('staff:session_update', {
            sessionId: session.id,
            status: 'active'
        });

        res.json({ status: 'active', message: 'Session approved' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error approving session' });
    }
};

// Close a session
const closeSession = async (req, res) => {
    const { sessionId } = req.params;

    try {
        const result = await db.query(
            "UPDATE sessions SET status = 'closed', end_time = NOW() WHERE id = $1 RETURNING *",
            [sessionId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Session not found' });
        }

        const session = result.rows[0];

        // Update table
        await db.query('UPDATE tables SET current_session_id = NULL WHERE id = $1', [session.table_id]);

        // Notify Table
        socketService.emitToTable(session.table_id, `table_${session.table_id}:session_closed`, {
            reason: 'Staff closed session'
        });

        // Notify Staff
        socketService.emitToStaff('staff:session_update', {
            sessionId: session.id,
            status: 'closed'
        });

        res.json({ message: 'Session closed' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error closing session' });
    }
};

// Get Sessions (with optional status filter)
const getSessions = async (req, res) => {
    const { status } = req.query;
    console.log(`[GetSessions] Fetching sessions with status: ${status || 'ALL'}`);
    try {
        let query = 'SELECT * FROM sessions';
        const values = [];

        if (status) {
            query += ' WHERE status = $1';
            values.push(status);
        }

        query += ' ORDER BY id ASC';

        const result = await db.query(query, values);
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching sessions' });
    }
};

// Get Session by Table ID (Public - for checking status)
const getSessionByTable = async (req, res) => {
    const { tableId } = req.params;
    try {
        const result = await db.query(
            "SELECT * FROM sessions WHERE table_id = $1 AND status IN ('pending', 'active') ORDER BY id DESC LIMIT 1",
            [tableId]
        );

        if (result.rows.length === 0) {
            return res.status(200).json(null); // No active session
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching session for table' });
    }
};

module.exports = {
    requestSession,
    approveSession,
    closeSession,
    getSessions,
    getSessionByTable
};
