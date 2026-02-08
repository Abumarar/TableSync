const db = require('../config/database');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const resetTables = async () => {
    try {
        console.log('Resetting tables...');
        await db.query('UPDATE tables SET current_session_id = NULL;');
        console.log('Tables reset.');

        console.log('Closing active/pending sessions...');
        await db.query("UPDATE sessions SET status = 'closed', end_time = NOW() WHERE status IN ('active', 'pending')");
        console.log('Sessions closed.');

        process.exit(0);
    } catch (error) {
        console.error('Error resetting tables:', error);
        process.exit(1);
    }
};

resetTables();
