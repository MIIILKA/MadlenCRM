import React, { useState } from 'react';
import api from '../../../api/';
import './UserDashboard.scss';

export const UserDashboard = ({ appointments, refreshData }) => {
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' або 'archive'
    const [selectedApp, setSelectedApp] = useState(null);
    const [cancelMode, setCancelArea] = useState({ id: null, reason: '' });

    // Перевірка, чи візит уже пройшов
    const isPastAppointment = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(dateStr) < today;
    };

    // Обробка оплати через LiqPay
    const handlePayment = async (app) => {
        // Пріоритет на фінальну ціну від майстра, якщо вона є
        const finalAmount = app.dyeingDetails?.finalPrice || app.service?.price || 0;
        try {
            const res = await api.post('/payments/generate', {
                amount: finalAmount,
                orderId: app._id,
                description: `Оплата за послугу: ${app.serviceName || app.service?.name}`
            });

            const form = document.createElement('form');
            form.method = 'POST';
            form.action = 'https://www.liqpay.ua/api/3/checkout';
            form.acceptCharset = 'utf-8';

            const dataInput = document.createElement('input');
            dataInput.type = 'hidden';
            dataInput.name = 'data';
            dataInput.value = res.data.data;
            form.appendChild(dataInput);

            const sigInput = document.createElement('input');
            sigInput.type = 'hidden';
            sigInput.name = 'signature';
            sigInput.value = res.data.signature;
            form.appendChild(sigInput);

            document.body.appendChild(form);
            form.submit();
        } catch (err) {
            alert("Помилка при створенні платежу");
        }
    };

    // Запити на скасування візиту
    const handleCancelRequest = async () => {
        if (!cancelMode.reason.trim()) return alert("Вкажіть причину скасування");
        try {
            await api.patch(`/appointments/${cancelMode.id}`, {
                status: 'cancelled',
                comment: `СКАСОВАНО КЛІЄНТОМ. Причина: ${cancelMode.reason}`,
                clientWishes: cancelMode.reason // Зберігаємо причину в історію побажань
            });
            alert("Запис скасовано.");
            setCancelArea({ id: null, reason: '' });
            if (refreshData) refreshData();
        } catch (err) {
            alert("Помилка при скасуванні");
        }
    };

    // Фільтрація записів
    const upcomingApps = appointments?.filter(app => !isPastAppointment(app.date) && app.status !== 'cancelled') || [];
    const archivedApps = appointments?.filter(app => isPastAppointment(app.date) || app.status === 'cancelled') || [];
    const currentApps = activeTab === 'upcoming' ? upcomingApps : archivedApps;

    return (
        <div className="user-dashboard-container">
            {/* ТАБИ КЕРУВАННЯ */}
            <div className="dashboard-tabs">
                <button
                    className={activeTab === 'upcoming' ? 'active' : ''}
                    onClick={() => setActiveTab('upcoming')}
                >
                    Активні <span>{upcomingApps.length}</span>
                </button>
                <button
                    className={activeTab === 'archive' ? 'active' : ''}
                    onClick={() => setActiveTab('archive')}
                >
                    Архів <span>{archivedApps.length}</span>
                </button>
            </div>

            {/* СІТКА ВІЗИТІВ */}
            <div className="appointments-grid">
                {currentApps.length > 0 ? currentApps.map(app => {
                    const past = isPastAppointment(app.date);
                    const isColoring = /фарб|color|dye/i.test(app.service?.name || app.serviceName || "");
                    const isCancelled = app.status === 'cancelled';
                    const displayPrice = app.dyeingDetails?.finalPrice || app.service?.price || 0;

                    return (
                        <div key={app._id} className={`visit-card ${isCancelled ? 'cancelled' : ''}`}>
                            <div className="card-top">
                                <div className="date-info">
                                    <span className="time">{app.time}</span>
                                    <span className="date">{new Date(app.date).toLocaleDateString('uk-UA')}</span>
                                </div>
                                <span className={`status-tag ${app.status}`}>
                                    {isCancelled ? 'Скасовано' : app.status}
                                </span>
                            </div>

                            <div className="card-body" onClick={() => isColoring && setSelectedApp(app)}>
                                <h4>{app.service?.name || app.serviceName || 'Послуга'}</h4>
                                <div className="price-label">{displayPrice} ₴</div>
                                {isColoring && !isCancelled && (
                                    <div className="detail-badge">Деталі фарбування 👁</div>
                                )}
                            </div>

                            {/* КНОПКА ОПЛАТИ (тільки для активних записів) */}
                            {!isCancelled && !past && (
                                <button className="pay-btn-luxury" onClick={() => handlePayment(app)}>
                                    ОПЛАТИТИ КАРТОЮ
                                </button>
                            )}

                            <div className="card-footer">
                                <div className="master">
                                    <span className="label">Майстер:</span>
                                    <span className="name">{app.staff?.name || app.masterName || 'Майстер'}</span>
                                </div>
                                {!past && !isCancelled && (
                                    <button
                                        className="btn-cancel"
                                        onClick={() => setCancelArea({ id: app._id, reason: '' })}
                                    >
                                        Скасувати
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="empty-state">
                        <p>{activeTab === 'upcoming' ? 'У вас немає активних записів' : 'Архів порожній'}</p>
                    </div>
                )}
            </div>

            {/* МОДАЛКА ДЕТАЛЕЙ (ФАРБУВАННЯ) */}
            {selectedApp && (
                <div className="user-modal-overlay" onClick={() => setSelectedApp(null)}>
                    <div className="luxury-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-top">
                            <span className="icon">✨</span>
                            <h4>Картка краси</h4>
                            <button className="close-x" onClick={() => setSelectedApp(null)}>✕</button>
                        </div>
                        <div className="modal-main">
                            <div className="info-row">
                                <label>Процедура</label>
                                <span>{selectedApp.service?.name || selectedApp.serviceName}</span>
                            </div>

                            {selectedApp.clientWishes && (
                                <div className="info-row wishes-highlight">
                                    <label>Ваш запит на колір</label>
                                    <span className="wish-text">"{selectedApp.clientWishes}"</span>
                                </div>
                            )}

                            {selectedApp.dyeingDetails?.finalPrice ? (
                                <div className="dyeing-results">
                                    <div className="info-row">
                                        <label>Використано матеріалів</label>
                                        <span>{selectedApp.dyeingDetails.grams || 0} г</span>
                                    </div>
                                    <div className="info-row price-highlight">
                                        <label>Підсумкова вартість</label>
                                        <span className="gold-total">{selectedApp.dyeingDetails.finalPrice} ₴</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="formula-safe-box">
                                    <span className="material-symbols-rounded">security</span>
                                    <p>Формула та точний розрахунок будуть доступні після завершення.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* МОДАЛКА СКАСУВАННЯ */}
            {cancelMode.id && (
                <div className="user-modal-overlay" onClick={() => setCancelArea({ id: null, reason: '' })}>
                    <div className="luxury-modal cancel-theme" onClick={e => e.stopPropagation()}>
                        <h4>Скасувати візит?</h4>
                        <textarea
                            value={cancelMode.reason}
                            onChange={(e) => setCancelArea({...cancelMode, reason: e.target.value})}
                            placeholder="Вкажіть причину (це допоможе нам стати кращими)..."
                        />
                        <button className="confirm-btn" onClick={handleCancelRequest}>Підтвердити скасування</button>
                        <button className="abort-btn" onClick={() => setCancelArea({ id: null, reason: '' })}>Повернутися</button>
                    </div>
                </div>
            )}
        </div>
    );
};