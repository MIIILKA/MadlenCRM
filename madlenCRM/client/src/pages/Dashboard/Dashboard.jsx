import './Dashboard.scss'

const stats = [
    { label: 'Revenue today',   value: '₴4,280',  delta: '+12%', icon: 'account_balance_wallet', positive: true },
    { label: 'Appointments',    value: '18',       delta: '+3',   icon: 'calendar_month',         positive: true },
    { label: 'New clients',     value: '5',        delta: '+2',   icon: 'person_add',             positive: true },
    { label: 'Avg. bill',       value: '₴ 238',   delta: '-4%',  icon: 'receipt_long',           positive: false },
]

const appointments = [
    { time: '09:00', client: 'Олена Коваль',    service: 'Haircut + Color',  master: 'Anna',   status: 'done' },
    { time: '10:30', client: 'Марія Шевченко',  service: 'Manicure',         master: 'Sofia',  status: 'done' },
    { time: '12:00', client: 'Іванна Мельник',  service: 'Brow design',      master: 'Anna',   status: 'active' },
    { time: '13:30', client: 'Тетяна Бойко',    service: 'Haircut',          master: 'Lena',   status: 'upcoming' },
    { time: '15:00', client: 'Оксана Савченко', service: 'Nails + Pedicure', master: 'Sofia',  status: 'upcoming' },
    { time: '16:30', client: 'Наталія Руденко', service: 'Face care',        master: 'Anna',   status: 'upcoming' },
]

const masters = [
    { name: 'Anna',  avatar: 'A', done: 4, total: 6, color: '#C9A84C' },
    { name: 'Sofia', avatar: 'S', done: 3, total: 5, color: '#5B8DEF' },
    { name: 'Lena',  avatar: 'L', done: 2, total: 4, color: '#4CAF7D' },
]

const statusLabel = { done: 'Done', active: 'In progress', upcoming: 'Upcoming' }

export default function Dashboard() {
    const now = new Date().toLocaleDateString('uk-UA', {
        weekday: 'long', day: 'numeric', month: 'long'
    })

    return (
        <div className="dashboard">

            {/* ── Header ── */}
            <div className="dashboard__head">
                <div>
                    <p className="dashboard__date">{now}</p>
                    <h2 className="dashboard__welcome">Good morning, Admin 👋</h2>
                </div>
                <button className="dashboard__new-btn">
                    <span className="material-symbols-rounded">add</span>
                    New appointment
                </button>
            </div>

            {/* ── Stats ── */}
            <div className="dashboard__stats">
                {stats.map((s) => (
                    <div key={s.label} className="stat-card">
                        <div className="stat-card__top">
                            <span className="stat-card__label">{s.label}</span>
                            <div className="stat-card__icon-wrap">
                                <span className="material-symbols-rounded">{s.icon}</span>
                            </div>
                        </div>
                        <div className="stat-card__value">{s.value}</div>
                        <div className={`stat-card__delta ${s.positive ? 'stat-card__delta--up' : 'stat-card__delta--down'}`}>
              <span className="material-symbols-rounded">
                {s.positive ? 'trending_up' : 'trending_down'}
              </span>
                            {s.delta} vs yesterday
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Bottom grid ── */}
            <div className="dashboard__grid">

                {/* Appointments */}
                <div className="dash-card">
                    <div className="dash-card__header">
                        <span className="dash-card__title">Today's appointments</span>
                        <button className="dash-card__link">View all</button>
                    </div>
                    <div className="appt-list">
                        {appointments.map((a, i) => (
                            <div key={i} className={`appt-item appt-item--${a.status}`}>
                                <div className="appt-item__time">{a.time}</div>
                                <div className="appt-item__dot" />
                                <div className="appt-item__info">
                                    <span className="appt-item__client">{a.client}</span>
                                    <span className="appt-item__service">{a.service}</span>
                                </div>
                                <div className="appt-item__right">
                                    <span className="appt-item__master">{a.master}</span>
                                    <span className={`appt-item__badge appt-item__badge--${a.status}`}>
                    {statusLabel[a.status]}
                  </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Masters */}
                <div className="dash-card">
                    <div className="dash-card__header">
                        <span className="dash-card__title">Masters today</span>
                        <button className="dash-card__link">Schedule</button>
                    </div>
                    <div className="masters-list">
                        {masters.map((m) => (
                            <div key={m.name} className="master-item">
                                <div className="master-item__avatar" style={{ background: m.color }}>
                                    {m.avatar}
                                </div>
                                <div className="master-item__info">
                                    <span className="master-item__name">{m.name}</span>
                                    <span className="master-item__count">{m.done} of {m.total} done</span>
                                </div>
                                <div className="master-item__bar-wrap">
                                    <div
                                        className="master-item__bar"
                                        style={{
                                            width: `${(m.done / m.total) * 100}%`,
                                            background: m.color,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Quick stats */}
                    <div className="dash-card__divider" />
                    <div className="quick-stats">
                        <div className="quick-stat">
                            <span className="quick-stat__value">₴ 12,840</span>
                            <span className="quick-stat__label">Month revenue</span>
                        </div>
                        <div className="quick-stat">
                            <span className="quick-stat__value">94%</span>
                            <span className="quick-stat__label">Retention rate</span>
                        </div>
                        <div className="quick-stat">
                            <span className="quick-stat__value">4.9 ★</span>
                            <span className="quick-stat__label">Avg. rating</span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}