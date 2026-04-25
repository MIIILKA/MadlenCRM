import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/';
import { UserDashboard } from './components/UserDashboard';
import { MasterDashboard } from './components/MasterDashboard';
import './Profile.scss';

export default function Profile({ subscribeToNotifications }) {
    const { user, logout } = useAuthStore();
    const [myAppointments, setMyAppointments] = useState([]);

    // 1. ДОДАЄМО СТАН ДЛЯ ПЕРМІШЕНІВ
    const [permission, setPermission] = useState(Notification.permission);

    useEffect(() => {
        if (user.role === 'user') {
            api.get('/appointments/my').then(res => setMyAppointments(res.data));
        }
    }, [user]);

    // 2. ФУНКЦІЯ-ОБРОБНИК КЛІКУ
    const handleSubscribe = async () => {
        await subscribeToNotifications();
        // Після того як функція відпрацює, оновлюємо стан, щоб кнопка "перефарбувалася"
        setPermission(Notification.permission);
    };

    const isSubscribed = permission === 'granted';

    return (
        <div className="profile-page">
            <header className="profile-header">
                <div className="user-info">
                    <div className="avatar large">{user.name.charAt(0)}</div>
                    <div>
                        <h1>{user.name}</h1>
                        <div className="profile-actions">
                            <span className="badge">{user.role}</span>

                            {/* 3. ОНОВЛЕНА КНОПКА (ЗАВЖДИ ВИДИМА) */}
                            <button
                                className={`push-subscribe-btn ${isSubscribed ? 'active' : 'inactive'}`}
                                onClick={handleSubscribe}
                                disabled={isSubscribed}
                            >
                                <span className="material-symbols-rounded">
                                    {isSubscribed ? 'notifications_active' : 'notifications_off'}
                                </span>
                                {isSubscribed ? 'Сповіщення увімкнено' : 'Увімкнути нагадування'}
                            </button>
                        </div>
                    </div>
                </div>
                <button className="logout-btn" onClick={logout}>Вийти</button>
            </header>

            <div className="profile-content">
                {user.role === 'user' && <UserDashboard appointments={myAppointments} />}
                {user.role === 'master' && <MasterDashboard />}
                {(user.role === 'admin' || user.role === 'owner') && (
                    <div className="admin-quick-links">
                        <h3>Керування системою</h3>
                        <div className="links-grid">
                            <button onClick={() => window.location.href='/dashboard'}>Аналітика</button>
                            <button onClick={() => window.location.href='/staff'}>Персонал</button>
                            <button onClick={() => window.location.href='/finance'}>Фінанси</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}