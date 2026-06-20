const router = require('express').Router();
const pool = require('../db');
const auth = require('../middleware/auth');
const coachOnly = require('../middleware/coachOnly');

router.get('/', auth, async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM teams ORDER BY id');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.post('/', auth, coachOnly, async (req, res) => {
    const { name, category } = req.body;
    if (!name || !category)
        return res.status(400).json({ error: 'Назва та категорія обов\'язкові' });
    try {
        const result = await pool.query(
            'INSERT INTO teams (name, category) VALUES ($1, $2) RETURNING *',
            [name, category]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.put('/:id', auth, coachOnly, async (req, res) => {
    const { name, category } = req.body;
    try {
        const result = await pool.query(
            'UPDATE teams SET name=$1, category=$2 WHERE id=$3 RETURNING *',
            [name, category, req.params.id]
        );
        if (!result.rows[0]) return res.status(404).json({ error: 'Команду не знайдено' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

router.delete('/:id', auth, coachOnly, async (req, res) => {
    try {
        await pool.query('DELETE FROM teams WHERE id=$1', [req.params.id]);
        res.json({ message: 'Команду видалено' });
    } catch (err) {
        if (err.code === '23503')
            return res.status(400).json({ error: 'Неможливо видалити: є прив\'язані гравці або події' });
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

module.exports = router;
