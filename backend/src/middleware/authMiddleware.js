const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (token == null) {
        console.log('[AuthMiddleware] No token provided');
        return res.sendStatus(401);
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret', (err, user) => {
        if (err) {
            console.log('[AuthMiddleware] Token verification failed:', err.message);
            return res.sendStatus(403);
        }
        console.log('[AuthMiddleware] User verified:', user.username, 'Role:', user.role);
        req.user = user;
        next();
    });
};

const authorizeRole = (roles) => {
    return (req, res, next) => {
        console.log('[AuthMiddleware] Authorizing role:', req.user.role, 'Allowed:', roles);
        if (!req.user || !roles.includes(req.user.role)) {
            console.log('[AuthMiddleware] access denied');
            return res.sendStatus(403);
        }
        next();
    };
};

module.exports = { authenticateToken, authorizeRole };
