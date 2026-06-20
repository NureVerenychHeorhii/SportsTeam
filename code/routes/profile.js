const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');
const bcrypt = require('bcryptjs');

// GET own profile + stats + attendance
router.get('/', auth, async (req, res) => {
    try {
        const [userR, statsR, attR, injR] = await Promise.all([
            pool.query(`
                SELECT u.id, u.first_name, u.last_name, u.email, u.role, u.team_id,
                       t.name AS team_name, t.category AS team_category
                FROM users u LEFT JOIN teams t ON u.team_id = t.id
                WHERE u.id = $1
            `, [req.user.id]),
            pool.query(`
                SELECT COALESCE(SUM(ps.goals),0)::int    AS total_goals,
                       COUNT(ps.id)::int                 AS games_played,
                       ROUND(AVG(ps.rating)::numeric,1)  AS avg_rating
                FROM player_stats ps WHERE ps.user_id = $1
            `, [req.user.id]),
            pool.query(`
                SELECT
                  COUNT(*)::int AS total,
                  SUM(CASE WHEN status='present' THEN 1 ELSE 0 END)::int AS present,
                  SUM(CASE WHEN status='absent'  THEN 1 ELSE 0 END)::int AS absent,
                  SUM(CASE WHEN status='late'    THEN 1 ELSE 0 END)::int AS late
                FROM attendance WHERE user_id = $1
            `, [req.user.id]),
            pool.query(`
                SELECT * FROM injuries WHERE user_id = $1 ORDER BY incident_date DESC LIMIT 5
            `, [req.user.id]),
        ]);
        res.json({
            user:       userR.rows[0],
            stats:      statsR.rows[0],
            attendance: attR.rows[0],
            injuries:   injR.rows,
        });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT update own profile (name + optional password)
router.put('/', auth, async (req, res) => {
    const { first_name, last_name, password } = req.body;
    if (!first_name || !last_name)
        return res.status(400).json({ error: 'Ім\'я та прізвище обов\'язкові' });
    try {
        if (password) {
            if (password.length < 6) return res.status(400).json({ error: 'Пароль мінімум 6 символів' });
            const hash = await bcrypt.hash(password, 10);
            await pool.query('UPDATE users SET first_name=$1, last_name=$2, password_hash=$3 WHERE id=$4',
                [first_name, last_name, hash, req.user.id]);
        } else {
            await pool.query('UPDATE users SET first_name=$1, last_name=$2 WHERE id=$3',
                [first_name, last_name, req.user.id]);
        }
        const r = await pool.query(
            'SELECT id, first_name, last_name, email, role, team_id FROM users WHERE id=$1',
            [req.user.id]
        );
        res.json(r.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET my events (team events)
router.get('/events', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT e.*, t.name AS team_name
            FROM events e
            LEFT JOIN teams t ON e.team_id = t.id
            JOIN users u ON u.id = $1
            WHERE e.team_id = u.team_id OR e.team_id IS NULL
            ORDER BY e.event_date ASC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET my attendance history
router.get('/attendance', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT a.*, e.title, e.event_date, e.location
            FROM attendance a
            JOIN events e ON a.event_id = e.id
            WHERE a.user_id = $1
            ORDER BY e.event_date DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET my stats
router.get('/stats', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT ps.*, e.title AS event_title, e.event_date
            FROM player_stats ps
            JOIN events e ON ps.event_id = e.id
            WHERE ps.user_id = $1
            ORDER BY e.event_date DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET my team members
router.get('/team', auth, async (req, res) => {
    try {
        const userR = await pool.query('SELECT team_id FROM users WHERE id=$1', [req.user.id]);
        const teamId = userR.rows[0]?.team_id;
        if (!teamId) return res.json([]);
        const result = await pool.query(`
            SELECT u.id, u.first_name, u.last_name, u.role, u.email
            FROM users u WHERE u.team_id = $1 AND u.id != $2 ORDER BY u.role, u.last_name
        `, [teamId, req.user.id]);
        res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
