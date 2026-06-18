const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'Email та пароль обов\'язкові' });
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user || !user.password_hash)
            return res.status(401).json({ error: 'Невірний email або пароль' });
        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid)
            return res.status(401).json({ error: 'Невірний email або пароль' });
        const token = jwt.sign(
            { id: user.id, role: user.role, first_name: user.first_name, last_name: user.last_name, team_id: user.team_id },
            process.env.JWT_SECRET,
            { expiresIn: '8h' }
        );
        res.json({
            token,
            user: { id: user.id, role: user.role, first_name: user.first_name, last_name: user.last_name, team_id: user.team_id }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Помилка сервера' });
    }
});

module.exports = router;
