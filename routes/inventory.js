const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const coachOnly = require('../middleware/coachOnly');

router.get('/', auth, async (req, res) => {
    const { team_id } = req.query;
    try {
        const params = [];
        const where = team_id ? (params.push(team_id), 'WHERE i.team_id = $1') : '';
        const result = await pool.query(`
            SELECT i.*, t.name AS team_name
            FROM inventory i
            LEFT JOIN teams t ON i.team_id = t.id
            ${where}
            ORDER BY t.name NULLS LAST, i.item_name
        `, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.post('/', auth, coachOnly, async (req, res) => {
    const { team_id, item_name, quantity, condition } = req.body;
    if (!item_name || quantity == null)
        return res.status(400).json({ error: 'Назва та кількість обов\'язкові' });
    try {
        const result = await pool.query(
            'INSERT INTO inventory (team_id, item_name, quantity, condition) VALUES ($1, $2, $3, $4) RETURNING *',
            [team_id || null, item_name, quantity, condition || 'Нове']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.put('/:id', auth, coachOnly, async (req, res) => {
    const { team_id, item_name, quantity, condition } = req.body;
    try {
        const result = await pool.query(
            'UPDATE inventory SET team_id=$1, item_name=$2, quantity=$3, condition=$4 WHERE id=$5 RETURNING *',
            [team_id || null, item_name, quantity, condition, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Запис не знайдено' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.delete('/:id', auth, coachOnly, async (req, res) => {
    try {
        await pool.query('DELETE FROM inventory WHERE id=$1', [req.params.id]);
        res.json({ message: 'Запис видалено' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

module.exports = router;
