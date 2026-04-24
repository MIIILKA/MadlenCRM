import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/';
import { UserDashboard } from './components/UserDashboard';
import { MasterDashboard } from './components/MasterDashboard';
import './Profile.scss';

export default function Profile() {
    const { user, logout } = useAuthStore();
    const [myAppointments, setMyAppointments] = useState([]);

    useEffect(() => {
        if (user.role === 'user') {
            api.get('/appointments/my').then(res => setMyAppointments(res.data));
        }
    }, [user]);

    return (
        <div className="profile-page">
            <header className="profile-header">
                <div className="user-info">
                    <div className="avatar large">{user.name.charAt(0)}</div>
                    <div>
                        <h1>{user.name}</h1>
                        <span className="badge">{user.role}</span>
                    </div>
                </div>
                <button className="logout-btn" onClick={logout}>Вийти</button>
            </header>

            <div className="profile-content">
                {/* ДИНАМІЧНИЙ РЕНДЕР ЗАЛЕЖНО ВІД РОЛІ */}
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