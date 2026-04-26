const jwt = require('jsonwebtoken');

// Переконайся, що назви функцій ПРАВИЛЬНІ
exports.authMiddleware = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: "Немає токена" });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) { res.status(401).json({ message: "Невірний токен" }); }
};

exports.adminMiddleware = (req, res, next) => {
    // Дозволяємо і адміну, і овнеру
    if (req.user && (req.user.role === 'admin' || req.user.role === 'owner')) {
        next();
    } else {
        res.status(403).json({ message: "Доступ лише для адміністрації" });
    }
};
exports.calendarAccessMiddleware = (req, res, next) => {
    // Дозволяємо доступ овнеру, адміну ТА персоналу
    const allowedRoles = ['owner', 'admin', 'staff', 'master'];

    if (req.user && allowedRoles.includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: "У вас немає прав для перегляду календаря" });
    }
};