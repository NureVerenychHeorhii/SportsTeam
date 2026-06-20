const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const coachOnly = require('../middleware/coachOnly');

router.get('/', auth, async (req, res) => {
    const { event_id, user_id } = req.query;
    try {
        const conditions = [];
        const params = [];
        if (event_id) { conditions.push(`ps.event_id = $${params.length + 1}`); params.push(event_id); }
        if (user_id)  { conditions.push(`ps.user_id = $${params.length + 1}`);  params.push(user_id); }
        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
        const result = await pool.query(`
            SELECT ps.*, u.first_name, u.last_name, e.title AS event_title,
                   e.event_date
            FROM player_stats ps
            JOIN users  u ON ps.user_id  = u.id
            JOIN events e ON ps.event_id = e.id
            ${where}
            ORDER BY e.event_date DESC, u.last_name
        `, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.post('/', auth, coachOnly, async (req, res) => {
    const { user_id, event_id, rating, goals, coach_comment } = req.body;
    if (!user_id || !event_id)
        return res.status(400).json({ error: 'user_id та event_id обов\'язкові' });
    try {
        const result = await pool.query(
            `INSERT INTO player_stats (user_id, event_id, rating, goals, coach_comment)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (user_id, event_id)
             DO UPDATE SET rating=$3, goals=$4, coach_comment=$5
             RETURNING *`,
            [user_id, event_id, rating || null, goals || 0, coach_comment || '']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.put('/:id', auth, coachOnly, async (req, res) => {
    const { user_id, event_id, rating, goals, coach_comment } = req.body;
    try {
        const result = await pool.query(
            `UPDATE player_stats SET user_id=$1, event_id=$2, rating=$3, goals=$4, coach_comment=$5 WHERE id=$6 RETURNING *`,
            [user_id, event_id, rating || null, goals || 0, coach_comment || '', req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Запис не знайдено' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.delete('/:id', auth, coachOnly, async (req, res) => {
    try {
        await pool.query('DELETE FROM player_stats WHERE id=$1', [req.params.id]);
        res.json({ message: 'Запис видалено' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

module.exports = router;
