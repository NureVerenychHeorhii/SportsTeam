require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT),
});

async function setup() {
    try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255)`);
        console.log('✅ Колонку password_hash додано до users');

        await pool.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'player_stats_user_event_unique') THEN
                    ALTER TABLE player_stats ADD CONSTRAINT player_stats_user_event_unique UNIQUE (user_id, event_id);
                END IF;
            END $$;
        `);
        console.log('✅ Унікальний індекс для player_stats додано');

        await pool.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'attendance_event_user_unique') THEN
                    ALTER TABLE attendance ADD CONSTRAINT attendance_event_user_unique UNIQUE (event_id, user_id);
                END IF;
            END $$;
        `);
        console.log('✅ Унікальний індекс для attendance додано');

        const hash = await bcrypt.hash('admin123', 10);
        await pool.query(`
            INSERT INTO users (role, first_name, last_name, email, password_hash)
            VALUES ('coach', 'Адмін', 'Тренер', 'admin@club.com', $1)
            ON CONFLICT (email) DO UPDATE SET password_hash = $1
        `, [hash]);

        console.log('\n✅ Готово! Дані для входу:');
        console.log('   Email:  admin@club.com');
        console.log('   Пароль: admin123\n');
        console.log('Запустіть сервер: node server.js');
    } catch (err) {
        console.error('❌ Помилка:', err.message);
    } finally {
        await pool.end();
    }
}

setup();
