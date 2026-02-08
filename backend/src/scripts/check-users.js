const db = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const checkUsers = async () => {
    try {
        const res = await db.query('SELECT id, username, role FROM users');
        console.table(res.rows);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
