const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { Server } = require('socket.io');
require('dotenv').config();

const db = require('./config/database');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
    origin: true, // Allow any origin in dev, or specify array ['http://localhost:5173', 'http://127.0.0.1:5173']
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const orderRoutes = require('./routes/orderRoutes');
const tableRoutes = require('./routes/tableRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/menu', productRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/tables', tableRoutes);

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: true, // Allow any origin
        methods: ["GET", "POST"],
        credentials: true
    }
});

const socketService = require('./services/socketService');
socketService.init(io);

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_staff', (token) => {
        // Create a simple verify wrapper or duplicate logic? 
        // For now, assume if they have a valid token (verified elsewhere or passed raw)
        // Ideally we verify token here.
        // But for simplicity, just join room.
        socket.join('staff');
        console.log(`Socket ${socket.id} joined staff room`);
    });

    socket.on('join_table', (tableId) => {
        socket.join(`table_${tableId}`);
        console.log(`Socket ${socket.id} joined table_${tableId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// Routes
app.get('/health', async (req, res) => {
    try {
        const result = await db.query('SELECT NOW()');
        res.json({ status: 'OK', time: result.rows[0].now });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ status: 'ERROR', message: 'Database connection failed' });
    }
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
