const db = require('../config/database');

const getMenu = async (req, res) => {
    try {
        // Fetch categories with their products
        const categoriesResult = await db.query(
            'SELECT * FROM categories WHERE is_active = true ORDER BY sort_order ASC'
        );
        const categories = categoriesResult.rows;

        const productsResult = await db.query(
            'SELECT * FROM products WHERE is_available = true'
        );
        const products = productsResult.rows;

        // Group products by category
        const menu = categories.map(cat => ({
            ...cat,
            products: products.filter(p => p.category_id === cat.id)
        }));

        res.json(menu);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching menu' });
    }
};

module.exports = {
    getMenu
};
