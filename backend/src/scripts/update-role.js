const db = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const updateAdmin = async () => {
    try {
        console.log("Updating admin role...");
        await db.query("UPDATE users SET role = 'admin' WHERE username = 'admin'");
        console.log("Admin role updated.");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

updateAdmin();
