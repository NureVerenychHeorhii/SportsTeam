require('dotenv').config();
const pool   = require('./db');
const bcrypt = require('bcryptjs');

async function seed() {
    console.log('🌱 Починаємо заповнення бази даних...\n');

    // 1. Teams
    const teams = await pool.query(`
        INSERT INTO teams (name, category) VALUES
          ('Динамо Київ', 'Основа'),
          ('Шахтар U-21', 'U-21'),
          ('Карпати', 'U-19')
        ON CONFLICT DO NOTHING RETURNING id, name
    `);
    console.log('✅ Команди:', teams.rowCount, 'додано');

    const allTeams = await pool.query('SELECT id, name FROM teams ORDER BY id');
    const [t1, t2, t3] = allTeams.rows;

    // 2. Users (hash password "pass123")
    const hash = await bcrypt.hash('pass123', 10);
    const adminHash = await bcrypt.hash('admin123', 10);

    const users = await pool.query(`
        INSERT INTO users (first_name, last_name, email, role, team_id, password_hash) VALUES
          ('Адмін',    'Тренер',    'admin@club.com',      'admin',  NULL,       $1),
          ('Сергій',   'Коваленко', 'kovalenko@club.com',  'coach',  NULL,       $2),
          ('Олег',     'Мусієнко',  'musiienko@club.com',  'coach',  ${t1?.id||1}, $2),
          ('Андрій',   'Шевченко',  'shevchenko@club.com', 'player', ${t1?.id||1}, $2),
          ('Іван',     'Петренко',  'petrenko@club.com',   'player', ${t1?.id||1}, $2),
          ('Дмитро',   'Савченко',  'savchenko@club.com',  'player', ${t1?.id||1}, $2),
          ('Михайло',  'Бойко',     'boyko@club.com',      'player', ${t1?.id||1}, $2),
          ('Олексій',  'Ткаченко',  'tkachenko@club.com',  'player', ${t2?.id||2}, $2),
          ('Василь',   'Кравченко', 'kravchenko@club.com', 'player', ${t2?.id||2}, $2),
          ('Роман',    'Мельник',   'melnyk@club.com',     'player', ${t2?.id||2}, $2),
          ('Назар',    'Лисенко',   'lysenko@club.com',    'player', ${t3?.id||3}, $2),
          ('Богдан',   'Гриценко',  'hrytsenko@club.com',  'player', ${t3?.id||3}, $2)
        ON CONFLICT (email) DO NOTHING
    `, [adminHash, hash]);
    console.log('✅ Користувачі:', users.rowCount, 'додано');

    const allUsers   = await pool.query("SELECT id, first_name, last_name, role, team_id FROM users ORDER BY id");
    const players    = allUsers.rows.filter(u => u.role === 'player');
    const playerIds  = players.map(p => p.id);

    // 3. Events
    const now = new Date();
    const d = (days) => new Date(now.getTime() + days*86400000).toISOString();

    const events = await pool.query(`
        INSERT INTO events (team_id, title, event_date, location, description) VALUES
          (${t1?.id||1}, 'Тренування — техніка',        '${d(-14)}', 'Стадіон НСК Олімпійський', 'Відпрацювання передач та удари'),
          (${t1?.id||1}, 'Товариський матч vs Ворскла',  '${d(-7)}',  'НСК Олімпійський',          'Контрольний матч перед сезоном'),
          (${t1?.id||1}, 'Тренування — тактика',         '${d(2)}',   'Тренувальна база',           'Тактична підготовка до чемпіонату'),
          (${t1?.id||1}, 'Чемпіонат — 1 тур',           '${d(7)}',   'НСК Олімпійський',          'Перша гра чемпіонату'),
          (${t2?.id||2}, 'Тренування U-21',              '${d(-3)}',  'Тренувальна база',           null),
          (${t2?.id||2}, 'Кубок України U-21',           '${d(10)}',  'Стадіон Металіст',          'Кубковий матч'),
          (${t3?.id||3}, 'Відбіркова гра U-19',          '${d(5)}',   'Стадіон Карпат',             null)
        ON CONFLICT DO NOTHING RETURNING id
    `);
    console.log('✅ Події:', events.rowCount, 'додано');

    const allEvents = await pool.query('SELECT id FROM events ORDER BY id');
    const eventIds  = allEvents.rows.map(e => e.id);

    if (playerIds.length >= 2 && eventIds.length >= 2) {
        // 4. Attendance for first 2 events
        const statuses = ['present','present','present','absent','late'];
        const attRows = [];
        for (const eid of eventIds.slice(0,2)) {
            for (const uid of playerIds) {
                const s = statuses[Math.floor(Math.random()*statuses.length)];
                attRows.push(`(${eid}, ${uid}, '${s}')`);
            }
        }
        if (attRows.length) {
            const att = await pool.query(`
                INSERT INTO attendance (event_id, user_id, status) VALUES ${attRows.join(',')}
                ON CONFLICT (event_id, user_id) DO NOTHING
            `);
            console.log('✅ Відвідуваність:', att.rowCount, 'записів');
        }

        // 5. Player stats for first 2 events
        const statsRows = [];
        for (const eid of eventIds.slice(0,2)) {
            for (const uid of playerIds.slice(0,4)) {
                const goals   = Math.floor(Math.random()*3);
                const rating  = Math.floor(Math.random()*4)+6; // 6-9
                const comment = goals > 1 ? 'Відмінна гра' : goals === 1 ? 'Добра гра' : 'Потребує покращення';
                statsRows.push(`(${uid}, ${eid}, ${goals}, ${rating}, '${comment}')`);
            }
        }
        if (statsRows.length) {
            const stats = await pool.query(`
                INSERT INTO player_stats (user_id, event_id, goals, rating, coach_comment) VALUES ${statsRows.join(',')}
                ON CONFLICT (user_id, event_id) DO UPDATE SET goals=EXCLUDED.goals, rating=EXCLUDED.rating, coach_comment=EXCLUDED.coach_comment
            `);
            console.log('✅ Статистика:', stats.rowCount, 'записів');
        }
    }

    // 6. Injuries
    const injPlayers = playerIds.slice(0,3);
    if (injPlayers.length) {
        const inj = await pool.query(`
            INSERT INTO injuries (user_id, injury_type, incident_date, expected_recovery_date, status) VALUES
              (${injPlayers[0]}, 'Розтягнення литкового м''яза', '${d(-20)}', '${d(5)}',  'Лечится'),
              (${injPlayers[1]}, 'Забій коліна',                  '${d(-45)}', '${d(-10)}','Одужав'),
              (${injPlayers[2]||injPlayers[0]}, 'Перегрів',       '${d(-3)}',  '${d(4)}',  'Спостереження')
            ON CONFLICT DO NOTHING RETURNING id
        `);
        console.log('✅ Травми:', inj.rowCount, 'записів');
    }

    // 7. Inventory
    const inv = await pool.query(`
        INSERT INTO inventory (team_id, item_name, quantity, condition) VALUES
          (${t1?.id||1}, 'М''яч футбольний Nike',    12, 'Нове'),
          (${t1?.id||1}, 'Конуси тренувальні',       30, 'Задовільний'),
          (${t1?.id||1}, 'Жилетки манішки',          16, 'Нове'),
          (${t2?.id||2}, 'М''яч футбольний Adidas',   8, 'Задовільний'),
          (${t2?.id||2}, 'Ворота складні',             2, 'Задовільний'),
          (${t3?.id||3}, 'М''яч тренувальний',        5, 'Зношене'),
          (NULL,         'Аптечка першої допомоги',   3, 'Нове'),
          (NULL,         'Насос для м''ячів',          2, 'Задовільний'),
          (NULL,         'Сітка воротна',              1, 'Зношене')
        ON CONFLICT DO NOTHING RETURNING id
    `);
    console.log('✅ Інвентар:', inv.rowCount, 'записів');

    console.log('\n✨ База даних успішно заповнена!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔑 Логін адміна:  admin@club.com  / admin123');
    console.log('🔑 Логін тренера: kovalenko@club.com / pass123');
    console.log('🔑 Логін гравця:  shevchenko@club.com / pass123');
    pool.end();
}

seed().catch(e => { console.error('❌ Помилка:', e.message); pool.end(); });
