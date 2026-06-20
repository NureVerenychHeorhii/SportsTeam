require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/auth',       require('./routes/auth'));
app.use('/teams',      require('./routes/teams'));
app.use('/players',    require('./routes/players'));
app.use('/events',     require('./routes/events'));
app.use('/injuries',   require('./routes/injuries'));
app.use('/attendance', require('./routes/attendance'));
app.use('/stats',      require('./routes/stats'));
app.use('/inventory',  require('./routes/inventory'));
app.use('/coaches',    require('./routes/coaches'));
app.use('/dashboard',  require('./routes/dashboard'));
app.use('/admin',      require('./routes/admin'));
app.use('/profile',    require('./routes/profile'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено: http://localhost:${PORT}`);
    console.log(`📦 База: ${process.env.DB_NAME}@${process.env.DB_HOST}`);
});
