const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const coachOnly = require('../middleware/coachOnly');

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT i.*, u.first_name, u.last_name
            FROM injuries i
            JOIN users u ON i.user_id = u.id
            ORDER BY i.incident_date DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.post('/', auth, async (req, res) => {
    const { injury_type, incident_date, expected_recovery_date, status } = req.body;
    // Players submit for themselves; coaches/admins can specify user_id
    const isStaff = ['coach','admin'].includes(req.user.role);
    const user_id = isStaff ? (req.body.user_id || req.user.id) : req.user.id;
    if (!user_id || !injury_type || !incident_date)
        return res.status(400).json({ error: 'Тип травми та дата обов\'язкові' });
    try {
        const result = await pool.query(
            `INSERT INTO injuries (user_id, injury_type, incident_date, expected_recovery_date, status)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [user_id, injury_type, incident_date, expected_recovery_date || null, status || 'Лечится']
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.put('/:id', auth, async (req, res) => {
    const { user_id, injury_type, incident_date, expected_recovery_date, status } = req.body;
    try {
        // Players can only edit their own injuries
        const isStaff = ['coach','admin'].includes(req.user.role);
        const ownerCheck = isStaff ? '' : `AND user_id = ${req.user.id}`;
        const finalUserId = isStaff ? (user_id || req.user.id) : req.user.id;
        const result = await pool.query(
            `UPDATE injuries SET user_id=$1, injury_type=$2, incident_date=$3,
             expected_recovery_date=$4, status=$5 WHERE id=$6 ${ownerCheck} RETURNING *`,
            [finalUserId, injury_type, incident_date, expected_recovery_date || null, status, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Запис не знайдено або доступ заборонено' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.delete('/:id', auth, coachOnly, async (req, res) => {
    try {
        await pool.query('DELETE FROM injuries WHERE id=$1', [req.params.id]);
        res.json({ message: 'Запис видалено' });
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

module.exports = router;
