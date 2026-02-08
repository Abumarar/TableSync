const db = require('../config/database');
const bcrypt = require('bcrypt');

const seedData = async () => {
    try {
        console.log('Starting seed...');

        // Clear existing data
        await db.query('TRUNCATE TABLE users, order_items, orders, products, categories, sessions, tables RESTART IDENTITY CASCADE');

        // 1. Create Tables
        console.log('Creating tables...');
        const tables = [];
        for (let i = 1; i <= 10; i++) {
            const res = await db.query('INSERT INTO tables (table_number, qr_code) VALUES ($1, $2) RETURNING *', [i, `qr-table-${i}`]);
            tables.push(res.rows[0]);
        }

        // 2. Create Categories
        console.log('Creating categories...');
        const categories = [
            { name: 'Hot Drinks', sort_order: 1 },
            { name: 'Cold Drinks', sort_order: 2 },
            { name: 'Desserts', sort_order: 3 },
            { name: 'Sandwiches', sort_order: 4 }
        ];

        const categoryIds = {};
        for (const cat of categories) {
            const res = await db.query('INSERT INTO categories (name, sort_order) VALUES ($1, $2) RETURNING *', [cat.name, cat.sort_order]);
            categoryIds[cat.name] = res.rows[0].id;
        }

        // 3. Create Products
        console.log('Creating products...');
        const products = [
            { name: 'Espresso', description: 'Single shot of espresso', price: 2.00, category: 'Hot Drinks' },
            { name: 'Cappuccino', description: 'Espresso with steamed milk and foam', price: 3.50, category: 'Hot Drinks' },
            { name: 'Latte', description: 'Espresso with steamed milk', price: 3.50, category: 'Hot Drinks' },
            { name: 'Tea', description: 'Black or Green tea', price: 2.50, category: 'Hot Drinks' },

            { name: 'Iced Latte', description: 'Chilled latte over ice', price: 4.00, category: 'Cold Drinks' },
            { name: 'Lemonade', description: 'Freshly squeezed lemonade', price: 3.00, category: 'Cold Drinks' },
            { name: 'Smoothie', description: 'Berry mix smoothie', price: 4.50, category: 'Cold Drinks' },

            { name: 'Cheesecake', description: 'Classic NY cheesecake', price: 5.00, category: 'Desserts' },
            { name: 'Brownie', description: 'Chocolate walnut brownie', price: 3.50, category: 'Desserts' },

            { name: 'Club Sandwich', description: 'Chicken, bacon, lettuce, tomato', price: 7.00, category: 'Sandwiches' },
            { name: 'Cheese Toastie', description: 'Cheddar and mozzarella blend', price: 4.50, category: 'Sandwiches' }
        ];

        for (const prod of products) {
            await db.query(
                'INSERT INTO products (name, description, price, category_id, is_available) VALUES ($1, $2, $3, $4, $5)',
                [prod.name, prod.description, prod.price, categoryIds[prod.category], true]
            );
        }

        // 4. Create Staff User
        console.log('Creating admin user...');
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await db.query(
            "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
            ['admin', hashedPassword, 'admin']
        );

        await db.query(
            "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)",
            ['staff', hashedPassword, 'staff']
        );

        console.log('Seed completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
};

seedData();
