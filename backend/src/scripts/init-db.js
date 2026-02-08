const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function initDb() {
    try {
        const schemaPath = path.join(__dirname, '../db/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');

        console.log('Running schema migration...');
        await db.query(schema);
        console.log('Database initialized successfully.');

        // Seed some initial data if needed
        // Check if we have tables
        const res = await db.query('SELECT COUNT(*) FROM tables');
        if (parseInt(res.rows[0].count) === 0) {
            console.log('Seeding tables...');
            for (let i = 1; i <= 10; i++) {
                await db.query('INSERT INTO tables (table_number, qr_code) VALUES ($1, $2)', [i, `table-${i}`]);
            }
            console.log('Seeded 10 tables.');
        }
        // Check if we have categories
        const catRes = await db.query('SELECT COUNT(*) FROM categories');
        if (parseInt(catRes.rows[0].count) === 0) {
            console.log('Seeding categories...');
            const categories = ['Drinks', 'Main Course', 'Desserts'];
            for (const cat of categories) {
                await db.query('INSERT INTO categories (name) VALUES ($1)', [cat]);
            }
            console.log('Seeded categories.');
        }


    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    } finally {
        // We don't close the pool here because the script might be used in app startup
        // But if running standalone, we should exit
        if (require.main === module) {
            process.exit(0);
        }
    }
}

if (require.main === module) {
    initDb();
}

module.exports = initDb;
