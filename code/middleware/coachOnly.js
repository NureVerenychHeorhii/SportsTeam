module.exports = (req, res, next) => {
    if (req.user?.role !== 'coach' && req.user?.role !== 'admin')
        return res.status(403).json({ error: 'Доступ тільки для тренерів або адміністраторів' });
    next();
};