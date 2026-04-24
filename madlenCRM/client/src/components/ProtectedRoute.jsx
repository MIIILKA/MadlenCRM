import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const ProtectedRoute = ({ children, page }) => {
    const { user, isAuthenticated, isInitialized } = useAuthStore();

    // 1. Чекаємо, поки стор підтягне дані з localStorage (якщо є такий прапорець)
    // Якщо ініціалізації немає, просто перевіряємо isAuthenticated
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // 2. Список дозволів (Додай сюди 'profile' та 'booking' обов'язково!)
    const permissions = {
        profile: ['owner', 'admin', 'master', 'receptionist', 'user'],
        booking: ['owner', 'admin', 'master', 'receptionist', 'user'],
        dashboard: ['owner', 'admin'],
        calendar: ['owner', 'admin', 'receptionist', 'master'],
        clients: ['owner', 'admin', 'receptionist'],
        staff: ['owner', 'admin'],
        finance: ['owner']
    };

    const userRole = user?.role || 'user';

    // 3. Якщо сторінка є в списку, але ролі там немає — на головну
    if (permissions[page] && !permissions[page].includes(userRole)) {
        console.warn(`Доступ заборонено для ролі: ${userRole} на сторінку: ${page}`);
        return <Navigate to="/" replace />;
    }

    return children;
};

export default ProtectedRoute;