import React, { useState, useEffect } from 'react';
import api from '../../../api/';
import { useAuthStore } from '../../../store/authStore'; // ДОДАНО ІМПОРТ
import './MasterDash.scss';

export const MasterDashboard = () => {
    const { user } = useAuthStore();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Виводимо твій ID, щоб порівняти з базою
    console.log("DEBUG: Мій ID (Соня):", user?._id);

    useEffect(() => {
        api.get('/appointments/master')
            .then(res => {
                console.log("DEBUG: Отримано записів з сервера:", res.data); // ДИВИСЬ СЮДИ В КОНСОЛІ
                setAppointments(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error loading master schedule:", err);
                setLoading(false);
            });
    }, []);

    const today = new Date().toISOString().split('T')[0];

    const todayApps = appointments.filter(app => app.date === today);
    const upcomingApps = appointments.filter(app => app.date > today);

    const formatDate = (dateStr) => {
        const d = new Date(dateStr);
        return d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
    };

    if (loading) return <div className="dash-loader">Завантаження графіку...</div>;

    return (
        <div className="master-dash">
            <div className="master-dash__stats">
                <div className="stat-card">
                    <span className="stat-label">На сьогодні</span>
                    <span className="stat-value">{todayApps.length}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Майбутні</span>
                    <span className="stat-value">{upcomingApps.length}</span>
                </div>
            </div>

            <div className="master-dash__schedule">
                <h3>Записи на сьогодні ({formatDate(today)})</h3>
                <div className="schedule-list">
                    {todayApps.length > 0 ? todayApps.map(app => (
                        <div key={app._id} className="schedule-item today">
                            <div className="time-col">
                                <span className="time">{app.time}</span>
                            </div>
                            <div className="info-col">
                                <div className="client-name">{app.client?.name || 'Клієнт'}</div>
                                <div className="service-name">{app.service?.name}</div>
                            </div>
                            <div className="status-col">
                                <span className={`status-badge ${app.status}`}>{app.status}</span>
                            </div>
                        </div>
                    )) : (
                        <div className="empty-state">На сьогодні записів немає ☕</div>
                    )}
                </div>
            </div>

            {upcomingApps.length > 0 && (
                <div className="master-dash__schedule upcoming">
                    <h3>Майбутні записи</h3>
                    <div className="schedule-list">
                        {upcomingApps.map(app => (
                            <div key={app._id} className="schedule-item">
                                <div className="time-col">
                                    <span className="date-badge">{formatDate(app.date)}</span>
                                    <span className="time">{app.time}</span>
                                </div>
                                <div className="info-col">
                                    <div className="client-name">{app.client?.name || 'Клієнт'}</div>
                                    <div className="service-name">{app.service?.name}</div>
                                </div>
                                <div className="status-col">
                                    <span className="status-badge upcoming">Очікується</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <button className="full-calendar-btn" onClick={() => window.location.href='/calendar'}>
                <span className="material-symbols-rounded">calendar_month</span>
                Відкрити повний календар
            </button>
        </div>
    );
};