const router = require('express').Router();
const bcrypt = require('bcryptjs');
const pool = require('../db');
const auth = require('../middleware/auth');
const coachOnly = require('../middleware/coachOnly');

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.team_id, u.role, u.first_name, u.last_name, u.email, t.name AS team_name
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            WHERE u.role = 'player'
            ORDER BY u.last_name, u.first_name
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.post('/', auth, coachOnly, async (req, res) => {
    const { first_name, last_name, email, team_id, password } = req.body;
    if (!first_name || !last_name || !email || !password)
        return res.status(400).json({ error: 'Усі поля обов\'язкові' });
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, email, team_id, role, password_hash)
             VALUES ($1, $2, $3, $4, 'player', $5)
             RETURNING id, first_name, last_name, email, team_id, role`,
            [first_name, last_name, email, team_id || null, password_hash]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Гравець з таким email вже існує' });
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.put('/:id', auth, coachOnly, async (req, res) => {
    const { first_name, last_name, email, team_id, password } = req.body;
    try {
        let query, params;
        if (password) {
            const password_hash = await bcrypt.hash(password, 10);
            query = `UPDATE users SET first_name=$1, last_name=$2, email=$3, team_id=$4, password_hash=$5
                     WHERE id=$6 AND role='player'
                     RETURNING id, first_name, last_name, email, team_id, role`;
            params = [first_name, last_name, email, team_id || null, password_hash, req.params.id];
        } else {
            query = `UPDATE users SET first_name=$1, last_name=$2, email=$3, team_id=$4
                     WHERE id=$5 AND role='player'
                     RETURNING id, first_name, last_name, email, team_id, role`;
            params = [first_name, last_name, email, team_id || null, req.params.id];
        }
        const result = await pool.query(query, params);
        if (!result.rows[0]) return res.status(404).json({ error: 'Гравця не знайдено' });
        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(400).json({ error: 'Цей email вже зайнятий' });
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.delete('/:id', auth, coachOnly, async (req, res) => {
    try {
        await pool.query("DELETE FROM users WHERE id=$1 AND role='player'", [req.params.id]);
        res.json({ message: 'Гравця видалено' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

module.exports = router;
