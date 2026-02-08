const db = require('../config/database');

const getTables = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM tables ORDER BY table_number ASC');
        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error fetching tables' });
    }
};

module.exports = {
    getTables
};
