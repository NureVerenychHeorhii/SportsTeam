const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const coachOnly = require('../middleware/coachOnly');

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT e.*, t.name AS team_name
            FROM events e
            LEFT JOIN teams t ON e.team_id = t.id
            ORDER BY e.event_date ASC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.post('/', auth, coachOnly, async (req, res) => {
    const { team_id, title, event_date, location, description } = req.body;
    if (!title || !event_date)
        return res.status(400).json({ error: 'Назва та дата обов\'язкові' });
    try {
        const result = await pool.query(
            'INSERT INTO events (team_id, title, event_date, location, description) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [team_id || null, title, event_date, location || '', description || '']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.put('/:id', auth, coachOnly, async (req, res) => {
    const { team_id, title, event_date, location, description } = req.body;
    try {
        const result = await pool.query(
            'UPDATE events SET team_id=$1, title=$2, event_date=$3, location=$4, description=$5 WHERE id=$6 RETURNING *',
            [team_id || null, title, event_date, location || '', description || '', req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Подію не знайдено' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.delete('/:id', auth, coachOnly, async (req, res) => {
    try {
        await pool.query('DELETE FROM events WHERE id=$1', [req.params.id]);
        res.json({ message: 'Подію видалено' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

module.exports = router;
