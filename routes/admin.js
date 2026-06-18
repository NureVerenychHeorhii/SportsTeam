const router   = require('express').Router();
const pool     = require('../db');
const auth     = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const bcrypt   = require('bcryptjs');

// All routes require auth + admin
router.use(auth, adminOnly);

// GET all users
router.get('/users', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.team_id,
                   t.name AS team_name
            FROM users u
            LEFT JOIN teams t ON u.team_id = t.id
            ORDER BY u.role, u.last_name, u.first_name
        `);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH role only
router.patch('/users/:id/role', async (req, res) => {
    const { role } = req.body;
    const allowed = ['player', 'coach', 'admin'];
    if (!allowed.includes(role))
        return res.status(400).json({ error: 'Недопустима роль' });
    if (parseInt(req.params.id) === req.user.id)
        return res.status(400).json({ error: 'Не можна змінити власну роль' });
    try {
        const result = await pool.query(
            'UPDATE users SET role=$1 WHERE id=$2 RETURNING id, first_name, last_name, email, role',
            [role, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Користувача не знайдено' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PATCH team
router.patch('/users/:id/team', async (req, res) => {
    const { team_id } = req.body;
    try {
        const result = await pool.query(
            'UPDATE users SET team_id=$1 WHERE id=$2 RETURNING id, first_name, last_name, email, role, team_id',
            [team_id || null, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Користувача не знайдено' });
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE user
router.delete('/users/:id', async (req, res) => {
    if (parseInt(req.params.id) === req.user.id)
        return res.status(400).json({ error: 'Не можна видалити себе' });
    try {
        await pool.query('DELETE FROM users WHERE id=$1', [req.params.id]);
        res.json({ message: 'Видалено' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST create user
router.post('/users', async (req, res) => {
    const { first_name, last_name, email, role, team_id, password } = req.body;
    if (!first_name || !last_name || !email || !password)
        return res.status(400).json({ error: 'Заповніть всі обов\'язкові поля' });
    try {
        const hash = await bcrypt.hash(password, 10);
        const result = await pool.query(
            `INSERT INTO users (first_name, last_name, email, role, team_id, password_hash)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, first_name, last_name, email, role, team_id`,
            [first_name, last_name, email, role||'player', team_id||null, hash]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') return res.status(409).json({ error: 'Email вже використовується' });
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
