const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, first_name, last_name, email FROM users WHERE role='coach' ORDER BY last_name"
        );
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

module.exports = router;
