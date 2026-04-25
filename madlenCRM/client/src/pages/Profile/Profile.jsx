import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/';
import { UserDashboard } from './components/UserDashboard';
import { MasterDashboard } from './components/MasterDashboard';
import './Profile.scss';

export default function Profile({ subscribeToNotifications }) {
    const { user, logout } = useAuthStore();
    const [myAppointments, setMyAppointments] = useState([]);

    // Стан для пермішенів та додатковий прапорець для відписки
    const [permission, setPermission] = useState(Notification.permission);
    // Додаємо цей стан, щоб кнопка реагувала на відписку, навіть якщо браузер каже 'granted'
    const [isActuallySubscribed, setIsActuallySubscribed] = useState(Notification.permission === 'granted');

    useEffect(() => {
        if (user.role === 'user') {
            api.get('/appointments/my').then(res => setMyAppointments(res.data));
        }
    }, [user]);

    // ВИПРАВЛЕНА ФУНКЦІЯ: тепер вона і вмикає, і вимикає
    const handleTogglePush = async () => {
        if (isActuallySubscribed) {
            // Логіка відписки (видаляємо з БД)
            try {
                await api.post('/auth/unsubscribe');
                // Міняємо локальний стан, бо браузер не дасть скинути 'granted'
                setIsActuallySubscribed(false);
                alert("Ви відписалися від сповіщень. Ми більше не будемо вас турбувати.");
            } catch (err) {
                console.error("Помилка при відписці", err);
            }
        } else {
            // Логіка підписки
            await subscribeToNotifications();
            setPermission(Notification.permission);
            if (Notification.permission === 'granted') {
                setIsActuallySubscribed(true);
            }
        }
    };

    // Залишаємо цю функцію, як ти просив, але використовувати будемо handleTogglePush
    const handleSubscribe = async () => {
        await subscribeToNotifications();
        setPermission(Notification.permission);
        if (Notification.permission === 'granted') {
            setIsActuallySubscribed(true);
        }
    };

    return (
        <div className="profile-page">
            <header className="profile-header">
                <div className="user-info">
                    <div className="avatar large">{user.name.charAt(0)}</div>
                    <div>
                        <h1>{user.name}</h1>
                        <div className="profile-actions">
                            <span className="badge">{user.role}</span>

                            {/* ВИПРАВЛЕНА КНОПКА: прибрали disabled, змінили onClick */}
                            <button
                                className={`push-subscribe-btn ${isActuallySubscribed ? 'active' : 'inactive'}`}
                                onClick={handleTogglePush}
                            >
                                <span className="material-symbols-rounded">
                                    {isActuallySubscribed ? 'notifications_active' : 'notifications_off'}
                                </span>
                                {isActuallySubscribed ? 'Сповіщення увімкнено' : 'Увімкнути нагадування'}
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