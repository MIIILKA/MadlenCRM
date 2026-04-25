import './UserDashboard.scss'

export const UserDashboard = ({ appointments }) => {
    // Функція для перевірки, чи візит уже відбувся
    const isPastAppointment = (dateStr) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Обнуляємо час для коректного порівняння дат
        const appDate = new Date(dateStr);
        return appDate < today;
    };

    return (
        <div className="role-dashboard">
            <h3>Мої візити</h3>
            <div className="appointments-list">
                {appointments && appointments.length > 0 ? appointments.map(app => {
                    const past = isPastAppointment(app.date);

                    return (
                        <div key={app._id} className={`app-card ${past ? 'past' : 'upcoming'}`}>
                            <div className="app-card__header">
                                <span className="date-badge">{app.date} о {app.time}</span>
                                <span className={`status-pill ${app.status}`}>{app.status}</span>
                            </div>

                            <strong>{app.service?.name || 'Послуга видалена'}</strong>

                            <div className="app-card__footer">
                                <p>Майстер: <span>{app.staff?.name || 'Не вказано'}</span></p>
                                {app.service?.price && <span className="price-tag">{app.service.price} ₴</span>}
                            </div>
                        </div>
                    );
                }) : (
                    <div className="empty-state">У вас поки немає активних записів.</div>
                )}
            </div>
        </div>
    );
};