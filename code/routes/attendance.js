const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const coachOnly = require('../middleware/coachOnly');

router.get('/', auth, async (req, res) => {
    const { event_id } = req.query;
    if (!event_id) return res.status(400).json({ error: 'event_id обов\'язковий' });
    try {
        const result = await pool.query(`
            SELECT a.*, u.first_name, u.last_name
            FROM attendance a
            JOIN users u ON a.user_id = u.id
            WHERE a.event_id = $1
            ORDER BY u.last_name
        `, [event_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

// Bulk save: delete existing + insert new records for the event
router.post('/bulk', auth, coachOnly, async (req, res) => {
    const { event_id, records } = req.body;
    if (!event_id || !Array.isArray(records))
        return res.status(400).json({ error: 'event_id та records обов\'язкові' });
    try {
        await pool.query('DELETE FROM attendance WHERE event_id=$1', [event_id]);
        for (const r of records) {
            await pool.query(
                'INSERT INTO attendance (event_id, user_id, status) VALUES ($1, $2, $3)',
                [event_id, r.user_id, r.status]
            );
        }
        res.json({ message: 'Відвідуваність збережено' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

module.exports = router;
