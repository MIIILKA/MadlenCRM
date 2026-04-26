import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/';
import { UserDashboard } from './components/UserDashboard';
import { MasterDashboard } from './components/MasterDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import './Profile.scss';

export default function Profile({ subscribeToNotifications }) {
    const { user, logout } = useAuthStore();
    const [myAppointments, setMyAppointments] = useState([]);
    const [masterData, setMasterData] = useState(null);
    const [isActuallySubscribed, setIsActuallySubscribed] = useState(Notification.permission === 'granted');

    useEffect(() => {
        if (user.role === 'user') {
            api.get('/appointments/my').then(res => setMyAppointments(res.data)).catch(() => {});
        }

        // Тягнемо дані профілю, але не панікуємо, якщо їх немає (404)
        if (['master', 'admin', 'owner'].includes(user.role)) {
            const staffId = user.id || user._id;
            if (staffId && staffId !== "undefined") {
                api.get(`/staff/${staffId}`)
                    .then(res => setMasterData(res.data))
                    .catch(() => console.warn("Профіль не знайдено в базі staff. Використовуємо дані сесії."));
            }
        }
    }, [user]);

    const handleTogglePush = async () => {
        if (isActuallySubscribed) {
            try {
                await api.post('/auth/unsubscribe');
                setIsActuallySubscribed(false);
            } catch (err) { console.error(err); }
        } else {
            await subscribeToNotifications();
            if (Notification.permission === 'granted') setIsActuallySubscribed(true);
        }
    };

    return (
        <div className="profile-page">
            <header className="profile-header">
                <div className="user-info">
                    <div className="avatar large">
                        {masterData?.avatar ? (
                            <img src={masterData.avatar.startsWith('http') ? masterData.avatar : `https://madlencrm-backend.onrender.com/${masterData.avatar}`} alt="Avatar" />
                        ) : (
                            (masterData?.name || user.name || 'A').charAt(0)
                        )}
                    </div>
                    <div>
                        <h1>{masterData?.name || user.name}</h1>
                        <div className="profile-actions">
                            <span className="badge">{user.role}</span>
                            <button className={`push-subscribe-btn ${isActuallySubscribed ? 'active' : 'inactive'}`} onClick={handleTogglePush}>
                                <span className="material-symbols-rounded">{isActuallySubscribed ? 'notifications_active' : 'notifications_off'}</span>
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
                {(user.role === 'admin' || user.role === 'owner') && <AdminDashboard />}
            </div>
        </div>
    );
}