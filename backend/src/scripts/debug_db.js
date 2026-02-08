const { Pool } = require('pg');
require('dotenv').config(); // Load from .env in CWD

const pool = new Pool({
    user: process.env.DB_USER || 'abumarar', // Guessing based on home dir
    host: 'localhost',
    database: 'tablesync',
    password: process.env.DB_PASSWORD,
    port: 5432,
});

// Or use connection string if env has it
// const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    try {
        const res = await pool.query('SELECT * FROM sessions');
        console.log('Sessions:', res.rows);
        const tables = await pool.query('SELECT * FROM tables');
        console.log('Tables:', tables.rows);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

check();
