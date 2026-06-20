const router = require('express').Router();
const pool   = require('../db');
const auth   = require('../middleware/auth');

router.get('/', auth, async (req, res) => {
    try {
        const [kpi, upcoming, injuries, topScorers, teamSizes, attendanceSummary] = await Promise.all([
            pool.query(`
                SELECT
                  (SELECT COUNT(*) FROM users WHERE role = 'player')::int            AS total_players,
                  (SELECT COUNT(*) FROM users WHERE role = 'coach')::int             AS total_coaches,
                  (SELECT COUNT(*) FROM teams)::int                                  AS total_teams,
                  (SELECT COUNT(*) FROM events WHERE event_date >= NOW())::int       AS upcoming_events,
                  (SELECT COUNT(*) FROM events WHERE event_date < NOW())::int        AS past_events,
                  (SELECT COUNT(*) FROM injuries WHERE status NOT IN ('Одужав','recovered'))::int AS active_injuries,
                  (SELECT COUNT(*) FROM injuries)::int                               AS total_injuries,
                  (SELECT COUNT(*) FROM inventory)::int                              AS inventory_items,
                  (SELECT COALESCE(SUM(quantity),0) FROM inventory)::int             AS inventory_total_qty,
                  (SELECT COUNT(*) FROM inventory WHERE condition IN ('poor','Поганий'))::int AS inventory_poor,
                  (SELECT COUNT(*) FROM attendance)::int                             AS total_attendance_records,
                  (SELECT COUNT(*) FROM player_stats)::int                           AS total_stat_records
            `),
            pool.query(`
                SELECT e.id, e.title, e.event_date, e.location, t.name AS team_name
                FROM events e
                LEFT JOIN teams t ON e.team_id = t.id
                WHERE e.event_date >= NOW()
                ORDER BY e.event_date ASC
                LIMIT 7
            `),
            pool.query(`
                SELECT i.id, i.incident_date, i.injury_type, i.status,
                       i.expected_recovery_date,
                       u.first_name, u.last_name,
                       (NOW()::date - i.incident_date)::int AS days_ago
                FROM injuries i
                JOIN users u ON i.user_id = u.id
                ORDER BY i.incident_date DESC
                LIMIT 7
            `),
            pool.query(`
                SELECT u.id, u.first_name, u.last_name,
                       COALESCE(SUM(ps.goals),0)::int    AS total_goals,
                       COUNT(ps.id)::int                 AS games_played,
                       ROUND(AVG(ps.rating)::numeric, 1) AS avg_rating
                FROM users u
                LEFT JOIN player_stats ps ON ps.user_id = u.id
                WHERE u.role = 'player'
                GROUP BY u.id, u.first_name, u.last_name
                HAVING COALESCE(SUM(ps.goals),0) > 0
                ORDER BY total_goals DESC
                LIMIT 8
            `),
            pool.query(`
                SELECT t.id, t.name, t.category,
                       COUNT(u.id)::int AS player_count
                FROM teams t
                LEFT JOIN users u ON u.team_id = t.id AND u.role = 'player'
                GROUP BY t.id, t.name, t.category
                ORDER BY player_count DESC
            `),
            pool.query(`
                SELECT e.id, e.title, e.event_date,
                       COUNT(a.id)::int AS total,
                       SUM(CASE WHEN a.status = 'present' THEN 1 ELSE 0 END)::int AS present_count,
                       CASE WHEN COUNT(a.id) > 0
                            THEN ROUND(100.0 * SUM(CASE WHEN a.status='present' THEN 1 ELSE 0 END) / COUNT(a.id))::int
                            ELSE 0 END AS pct
                FROM events e
                JOIN attendance a ON a.event_id = e.id
                GROUP BY e.id, e.title, e.event_date
                ORDER BY e.event_date DESC
                LIMIT 6
            `)
        ]);

        res.json({
            kpi:               kpi.rows[0],
            upcomingEvents:    upcoming.rows,
            activeInjuries:    injuries.rows,
            topScorers:        topScorers.rows,
            teamSizes:         teamSizes.rows,
            attendanceSummary: attendanceSummary.rows,
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
