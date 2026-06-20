# SportManager — інформаційна система управління спортивною командою

Кваліфікаційна робота. Веб-система для управління спортивною командою з рольовим
розмежуванням доступу: **адміністратор**, **тренер**, **гравець**.

## Структура репозиторію

| Розташування | Опис |
|---|---|
| `code/` | Вихідний код програми (React-клієнт + Node.js/Express API) |
| `presentation.pptx` | Презентація проєкту |
| `demo.md` | Посилання на демонстраційний ролик |

## Технології

- **Frontend:** React 19 + Vite + React Router v7
- **Backend:** Node.js 20 + Express 5
- **База даних:** PostgreSQL 14
- **Авторизація:** JWT (8 год.) + bcryptjs (10 раундів), рольова модель RBAC

## Запуск проєкту

```bash
cd code
npm install
```

Створити у папці `code/` файл `.env` (приклад нижче), потім:

```bash
node setup.js     # створення таблиць у БД
node seed.js      # тестові дані (необов'язково)
node server.js    # запуск сервера -> http://localhost:3000
```

Клієнтська частина:

```bash
cd code/client
npm install
npm run dev
```

### Приклад файлу `.env`

```env
DB_USER=postgres
DB_HOST=localhost
DB_NAME=sports_team_db
DB_PASSWORD=ваш_пароль
DB_PORT=5432
JWT_SECRET=ваш_секретний_ключ
PORT=3000
```

> Файл `.env` не зберігається в репозиторії (додано до `.gitignore`),
> оскільки містить паролі та секретний ключ.

## Посилання

- 🎬 Демонстраційний ролик — див. [demo.md](demo.md)
- 📊 Презентація — `presentation.pptx`
- 💻 Код програми — папка [`code/`](code/)
