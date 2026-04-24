import { useState } from 'react'
import './Clients.scss'

const MOCK_CLIENTS = [
    { id: 1,  name: 'Олена Коваль',    phone: '+380 67 123 4567', visits: 14, spent: '₴ 8,420', last: '20.04.2026', tag: 'vip',     avatar: 'О' },
    { id: 2,  name: 'Марія Шевченко',  phone: '+380 50 234 5678', visits: 8,  spent: '₴ 3,200', last: '18.04.2026', tag: 'regular', avatar: 'М' },
    { id: 3,  name: 'Іванна Мельник',  phone: '+380 63 345 6789', visits: 3,  spent: '₴ 1,100', last: '15.04.2026', tag: 'new',     avatar: 'І' },
    { id: 4,  name: 'Тетяна Бойко',    phone: '+380 93 456 7890', visits: 22, spent: '₴12,800', last: '21.04.2026', tag: 'vip',     avatar: 'Т' },
    { id: 5,  name: 'Оксана Савченко', phone: '+380 67 567 8901', visits: 6,  spent: '₴ 2,640', last: '10.04.2026', tag: 'regular', avatar: 'О' },
    { id: 6,  name: 'Наталія Руденко', phone: '+380 50 678 9012', visits: 1,  spent: '₴   380', last: '22.04.2026', tag: 'new',     avatar: 'Н' },
    { id: 7,  name: 'Юлія Ткаченко',   phone: '+380 63 789 0123', visits: 18, spent: '₴ 9,750', last: '19.04.2026', tag: 'vip',     avatar: 'Ю' },
    { id: 8,  name: 'Вікторія Поліщук',phone: '+380 93 890 1234', visits: 5,  spent: '₴ 1,900', last: '12.04.2026', tag: 'regular', avatar: 'В' },
]

const TAG_LABELS = { vip: 'VIP', regular: 'Regular', new: 'New' }

export default function Clients() {
    const [search, setSearch]         = useState('')
    const [filter, setFilter]         = useState('all')
    const [selected, setSelected]     = useState(null)

    const filtered = MOCK_CLIENTS.filter(c => {
        const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.phone.includes(search)
        const matchFilter = filter === 'all' || c.tag === filter
        return matchSearch && matchFilter
    })

    const client = selected ? MOCK_CLIENTS.find(c => c.id === selected) : null

    return (
        <div className={`clients ${client ? 'clients--with-panel' : ''}`}>

            {/* ── List panel ── */}
            <div className="clients__list-panel">

                {/* Toolbar */}
                <div className="clients__toolbar">
                    <div className="clients__search">
                        <span className="material-symbols-rounded">search</span>
                        <input
                            type="text"
                            placeholder="Search by name or phone..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="clients__search-clear">
                                <span className="material-symbols-rounded">close</span>
                            </button>
                        )}
                    </div>
                    <div className="clients__filters">
                        {['all', 'vip', 'regular', 'new'].map(f => (
                            <button
                                key={f}
                                className={`clients__filter-btn ${filter === f ? 'clients__filter-btn--active' : ''}`}
                                onClick={() => setFilter(f)}
                            >
                                {f === 'all' ? 'All' : TAG_LABELS[f]}
                            </button>
                        ))}
                    </div>
                    <button className="clients__add-btn">
                        <span className="material-symbols-rounded">add</span>
                        Add client
                    </button>
                </div>

                {/* Count */}
                <div className="clients__count">
                    {filtered.length} client{filtered.length !== 1 ? 's' : ''}
                </div>

                {/* Table */}
                <div className="clients__table-wrap">
                    <table className="clients__table">
                        <thead>
                        <tr>
                            <th>Client</th>
                            <th>Phone</th>
                            <th>Visits</th>
                            <th>Total spent</th>
                            <th>Last visit</th>
                            <th>Tag</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filtered.map(c => (
                            <tr
                                key={c.id}
                                className={selected === c.id ? 'active' : ''}
                                onClick={() => setSelected(selected === c.id ? null : c.id)}
                            >
                                <td>
                                    <div className="clients__name-cell">
                                        <div className={`clients__avatar clients__avatar--${c.tag}`}>
                                            {c.avatar}
                                        </div>
                                        <span>{c.name}</span>
                                    </div>
                                </td>
                                <td className="clients__muted">{c.phone}</td>
                                <td>{c.visits}</td>
                                <td>{c.spent}</td>
                                <td className="clients__muted">{c.last}</td>
                                <td>
                    <span className={`clients__tag clients__tag--${c.tag}`}>
                      {TAG_LABELS[c.tag]}
                    </span>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={6} className="clients__empty">
                                    <span className="material-symbols-rounded">search_off</span>
                                    No clients found
                                </td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── Client card panel ── */}
            {client && (
                <div className="client-card">
                    <div className="client-card__header">
                        <span className="client-card__title">Client profile</span>
                        <button className="client-card__close" onClick={() => setSelected(null)}>
                            <span className="material-symbols-rounded">close</span>
                        </button>
                    </div>

                    <div className="client-card__hero">
                        <div className={`client-card__avatar client-card__avatar--${client.tag}`}>
                            {client.avatar}
                        </div>
                        <div className="client-card__hero-info">
                            <h3 className="client-card__name">{client.name}</h3>
                            <span className={`clients__tag clients__tag--${client.tag}`}>
                {TAG_LABELS[client.tag]}
              </span>
                        </div>
                    </div>

                    <div className="client-card__section">
                        <div className="client-card__row">
                            <span className="material-symbols-rounded">phone</span>
                            {client.phone}
                        </div>
                    </div>

                    <div className="client-card__stats">
                        <div className="client-card__stat">
                            <span className="client-card__stat-value">{client.visits}</span>
                            <span className="client-card__stat-label">Visits</span>
                        </div>
                        <div className="client-card__stat">
                            <span className="client-card__stat-value">{client.spent}</span>
                            <span className="client-card__stat-label">Total spent</span>
                        </div>
                        <div className="client-card__stat">
                            <span className="client-card__stat-value">{client.last}</span>
                            <span className="client-card__stat-label">Last visit</span>
                        </div>
                    </div>

                    <div className="client-card__section">
                        <p className="client-card__section-title">Notes</p>
                        <textarea
                            className="client-card__notes"
                            placeholder="Add a note about this client..."
                            rows={3}
                        />
                    </div>

                    <div className="client-card__actions">
                        <button className="client-card__btn client-card__btn--primary">
                            <span className="material-symbols-rounded">calendar_month</span>
                            New appointment
                        </button>
                        <button className="client-card__btn client-card__btn--secondary">
                            <span className="material-symbols-rounded">edit</span>
                            Edit
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}