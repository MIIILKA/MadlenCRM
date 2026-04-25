import React, { useState, useEffect } from 'react';
import api from '../../../api/';
import { useAuthStore } from '../../../store/authStore';
import './MasterDash.scss';

const DAYS_UK = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Нд'];
const JS_TO_UK = { 1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 0: 'Нд' };

// Функція для примусового формату 18:00 (24-годинний)
function formatTime(timeStr) {
    if (!timeStr) return '';
    const parts = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(parts[0], 10));
    date.setMinutes(parseInt(parts[1] || '0', 10));

    if (isNaN(date.getTime())) return timeStr;

    return date.toLocaleTimeString('uk-UA', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });
}

function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = (day === 0 ? -6 : 1 - day);
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function toISO(date) {
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().split('T')[0];
}

function formatDay(date) {
    return date.toLocaleDateString('uk-UA', {
        day: '2-digit',
        month: '2-digit'
    });
}

const DEFAULT_HOURS = {
    "1": { active: true,  start: '09:00', end: '18:00' },
    "2": { active: true,  start: '09:00', end: '18:00' },
    "3": { active: true,  start: '09:00', end: '18:00' },
    "4": { active: true,  start: '09:00', end: '18:00' },
    "5": { active: true,  start: '09:00', end: '18:00' },
    "6": { active: false, start: '10:00', end: '15:00' },
    "0": { active: false, start: '10:00', end: '14:00' },
};

const isDyeingService = (name = '') =>
    /фарб|color|colour|coloring|фарбув|тонув|балаяж|мелір|хайлайт|омбре/i.test(name);

// ── Калькулятор фарбування ────────────────────────────────────────────────────
function DyeingCalculator({ appointment, onClose }) {
    const [tubesUsed, setTubesUsed] = useState(1);
    const [tubeCost, setTubeCost]   = useState(150);
    const [extraCost, setExtraCost] = useState(0);

    const servicePrice = Number(appointment?.service?.price || 0);
    const materialCost = tubesUsed * tubeCost + Number(extraCost);
    const totalCost    = servicePrice + materialCost;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div className="modal-box__header">
                    <span className="material-symbols-rounded">palette</span>
                    <h3>Калькулятор фарбування</h3>
                    <button className="modal-box__close" onClick={onClose}>
                        <span className="material-symbols-rounded">close</span>
                    </button>
                </div>

                <div className="modal-box__body">
                    <div className="calc-info">
                        <span className="calc-info__label">Клієнт</span>
                        <span className="calc-info__value">{appointment?.client?.name || 'Клієнт'}</span>
                    </div>
                    <div className="calc-info">
                        <span className="calc-info__label">Послуга</span>
                        <span className="calc-info__value">{appointment?.service?.name}</span>
                    </div>
                    <div className="calc-info">
                        <span className="calc-info__label">Базова ціна</span>
                        <span className="calc-info__value gold">{servicePrice} ₴</span>
                    </div>

                    <div className="calc-divider" />

                    <label className="calc-field">
                        <span>Кількість тюбиків фарби</span>
                        <div className="calc-stepper">
                            <button onClick={() => setTubesUsed(t => Math.max(1, t - 1))}>−</button>
                            <span>{tubesUsed}</span>
                            <button onClick={() => setTubesUsed(t => t + 1)}>+</button>
                        </div>
                    </label>

                    <label className="calc-field">
                        <span>Вартість одного тюбика (₴)</span>
                        <input type="number" className="calc-input" value={tubeCost}
                               onChange={e => setTubeCost(Number(e.target.value))} min={0} />
                    </label>

                    <label className="calc-field">
                        <span>Додаткові витрати (окси, рукавички…)</span>
                        <input type="number" className="calc-input" value={extraCost}
                               onChange={e => setExtraCost(e.target.value)} min={0} />
                    </label>

                    <div className="calc-divider" />

                    <div className="calc-result">
                        <div className="calc-result__row">
                            <span>Матеріали</span>
                            <span>{materialCost} ₴</span>
                        </div>
                        <div className="calc-result__row calc-result__row--total">
                            <span>Разом з послугою</span>
                            <span className="gold">{totalCost} ₴</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Фінансова панель ──────────────────────────────────────────────────────────
function FinancePanel({ appointments, backendStats }) {
    const [openMonth, setOpenMonth] = useState(null);
    const [openWeek, setOpenWeek]   = useState(null);
    const [openDay, setOpenDay]     = useState(null);

    const now = new Date();

    // Логіка "автоматичного" завершення: статус completed АБО час минув (і не скасовано)
    const isActuallyCompleted = (a) => {
        const appDate = new Date(`${a.date}T${a.time}`);
        return a.status === 'completed' || (a.status !== 'cancelled' && appDate < now);
    };

    const completed = appointments.filter(isActuallyCompleted);

    // Використовуємо суму з бекенда або рахуємо локально як запасний варіант
    const totalAll = backendStats?.totalEarnings !== undefined ? backendStats.totalEarnings : completed.reduce((s, a) => s + Number(a.service?.price || 0), 0);

    const sum = (apps) => apps.reduce((s, a) => s + Number(a.service?.price || 0), 0);

    const byMonth = completed.reduce((acc, a) => {
        const key = a.date?.slice(0, 7);
        (acc[key] = acc[key] || []).push(a);
        return acc;
    }, {});

    const byWeek = (apps) => apps.reduce((acc, a) => {
        const key = toISO(getWeekStart(new Date(a.date)));
        (acc[key] = acc[key] || []).push(a);
        return acc;
    }, {});

    const byDay = (apps) => apps.reduce((acc, a) => {
        (acc[a.date] = acc[a.date] || []).push(a);
        return acc;
    }, {});

    const monthLabel = (key) => {
        const [y, m] = key.split('-');
        return new Date(y, m - 1).toLocaleDateString('uk-UA', { month: 'long', year: 'numeric' });
    };

    return (
        <div className="finance-panel">
            <div className="finance-panel__total">
                <span>Всього зароблено (автоматично)</span>
                <span className="gold">{totalAll} ₴</span>
            </div>

            <div className="finance-tree">
                {Object.entries(byMonth).sort((a,b) => b[0].localeCompare(a[0])).map(([mKey, mApps]) => {
                    const mOpen = openMonth === mKey;
                    return (
                        <div key={mKey} className="ftree-month">
                            <button className="ftree-row ftree-row--month" onClick={() => setOpenMonth(mOpen ? null : mKey)}>
                                <span className="material-symbols-rounded">{mOpen ? 'expand_less' : 'expand_more'}</span>
                                <span className="ftree-row__label">{monthLabel(mKey)}</span>
                                <span className="ftree-row__sum">{sum(mApps)} ₴</span>
                            </button>

                            {mOpen && Object.entries(byWeek(mApps)).sort((a,b) => b[0].localeCompare(a[0])).map(([wKey, wApps]) => {
                                const wOpen = openWeek === wKey;
                                return (
                                    <div key={wKey} className="ftree-week">
                                        <button className="ftree-row ftree-row--week" onClick={() => setOpenWeek(wOpen ? null : wKey)}>
                                            <span className="material-symbols-rounded">{wOpen ? 'expand_less' : 'expand_more'}</span>
                                            <span className="ftree-row__label">{formatDay(new Date(wKey))} — {formatDay(addDays(new Date(wKey), 6))}</span>
                                            <span className="ftree-row__sum">{sum(wApps)} ₴</span>
                                        </button>

                                        {wOpen && Object.entries(byDay(wApps)).sort((a,b) => b[0].localeCompare(a[0])).map(([dKey, dApps]) => {
                                            const dOpen = openDay === dKey;
                                            return (
                                                <div key={dKey} className="ftree-day">
                                                    <button className="ftree-row ftree-row--day" onClick={() => setOpenDay(dOpen ? null : dKey)}>
                                                        <span className="material-symbols-rounded">{dOpen ? 'expand_less' : 'expand_more'}</span>
                                                        <span className="ftree-row__label">{dKey}</span>
                                                        <span className="ftree-row__sum">{sum(dApps)} ₴</span>
                                                    </button>

                                                    {dOpen && dApps.map(a => (
                                                        <div key={a._id} className="ftree-service">
                                                            <span className="ftree-service__time">{formatTime(a.time)}</span>
                                                            <span className="ftree-service__name">{a.service?.name || '—'}</span>
                                                            <span className="ftree-service__price">{a.service?.price || 0} ₴</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>
                    );
                })}

                {completed.length === 0 && (
                    <div className="finance-empty">Поки що немає завершених записів</div>
                )}
            </div>
        </div>
    );
}

// ── Головний компонент ────────────────────────────────────────────────────────
export const MasterDashboard = () => {
    const { user } = useAuthStore();
    const [appointments, setAppointments] = useState([]);
    const [financeStats, setFinanceStats] = useState({ totalEarnings: 0 });
    const [loading, setLoading]           = useState(true);
    const [weekStart, setWeekStart]       = useState(() => getWeekStart(new Date()));
    const [showHours, setShowHours]       = useState(false);
    const [workHours, setWorkHours]       = useState(DEFAULT_HOURS);
    const [hoursSaved, setHoursSaved]     = useState(false);
    const [showFinance, setShowFinance]   = useState(false);
    const [calcApp, setCalcApp]           = useState(null);

    useEffect(() => {
        // 1. Завантаження записів майстра
        api.get('/appointments/master')
            .then(res => { setAppointments(res.data); setLoading(false); })
            .catch(() => setLoading(false));

        // 2. Завантаження автоматичних фінансів
        api.get('/appointments/finance/stats')
            .then(res => { setFinanceStats(res.data); })
            .catch(err => console.error("Фінанси недоступні:", err));

        // 3. Завантаження робочих годин
        api.get('/appointments/staff/work-hours')
            .then(res => {
                if (res.data && Object.keys(res.data).length) {
                    const normalized = {};
                    Object.keys(res.data).forEach(k => normalized[String(k)] = res.data[k]);
                    setWorkHours(normalized);
                }
            })
            .catch(() => {});
    }, []);

    const today      = toISO(new Date());
    const weekDays   = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
    const appsByDate = appointments.reduce((acc, app) => {
        (acc[app.date] = acc[app.date] || []).push(app);
        return acc;
    }, {});

    const totalToday    = (appsByDate[today] || []).length;
    const totalUpcoming = appointments.filter(a => a.date > today).length;

    const handleHourChange = (dayIndex, field, value) =>
        setWorkHours(prev => ({ ...prev, [String(dayIndex)]: { ...prev[String(dayIndex)], [field]: value } }));

    const handleSaveHours = async () => {
        try { await api.post('/appointments/staff/work-hours', workHours); } catch {}
        setHoursSaved(true);
        setTimeout(() => setHoursSaved(false), 2500);
    };

    if (loading) return <div className="dash-loader">Завантаження графіку...</div>;

    return (
        <div className="master-dash">

            {/* Статистика */}
            <div className="master-dash__stats">
                <div className="stat-card">
                    <span className="stat-label">На сьогодні</span>
                    <span className="stat-value">{totalToday}</span>
                </div>
                <div className="stat-card">
                    <span className="stat-label">Майбутні</span>
                    <span className="stat-value">{totalUpcoming}</span>
                </div>
            </div>

            {/* Мої фінанси */}
            <div className="master-dash__work-hours">
                <button className="work-hours-toggle finance-toggle" onClick={() => setShowFinance(h => !h)}>
                    <span className="material-symbols-rounded">payments</span>
                    Мої фінанси
                    <span className="material-symbols-rounded toggle-arrow">
                        {showFinance ? 'expand_less' : 'expand_more'}
                    </span>
                </button>
                {showFinance && <FinancePanel appointments={appointments} backendStats={financeStats} />}
            </div>

            {/* Тижневий календар */}
            <div className="master-dash__calendar">
                <div className="cal-header">
                    <button className="cal-nav" onClick={() => setWeekStart(w => addDays(w, -7))}>
                        <span className="material-symbols-rounded">chevron_left</span>
                    </button>
                    <span className="cal-range">
                        {formatDay(weekStart)} — {formatDay(addDays(weekStart, 6))}
                    </span>
                    <button className="cal-nav" onClick={() => setWeekStart(w => addDays(w, 7))}>
                        <span className="material-symbols-rounded">chevron_right</span>
                    </button>
                </div>

                <div className="cal-grid">
                    {weekDays.map((day, i) => {
                        const iso       = toISO(day);
                        const isToday   = iso === today;
                        const isPast    = iso < today;
                        const dayApps   = appsByDate[iso] || [];
                        const hours     = workHours[String(day.getDay())];

                        return (
                            <div key={iso} className={`cal-day ${isToday ? 'cal-day--today' : ''} ${isPast ? 'cal-day--past' : ''} ${!hours?.active ? 'cal-day--off' : ''}`}>
                                <div className="cal-day__head">
                                    <span className="cal-day__name">{JS_TO_UK[day.getDay()]}</span>
                                    <span className="cal-day__date">{formatDay(day)}</span>
                                    {hours?.active
                                        ? <span className="cal-day__hours">{formatTime(hours.start)}–{formatTime(hours.end)}</span>
                                        : <span className="cal-day__off-label">вихідний</span>
                                    }
                                </div>
                                <div className="cal-day__apps">
                                    {dayApps.length === 0 && hours?.active && !isPast && (
                                        <div className="cal-day__free">вільно</div>
                                    )}
                                    {dayApps.map(app => {
                                        const isDyeing = isDyeingService(app.service?.name);
                                        const appPast = iso < today || (iso === today && app.time < new Date().toLocaleTimeString('uk-UA', {hour: '2-digit', minute:'2-digit'}));

                                        return (
                                            <div
                                                key={app._id}
                                                className={`cal-event status-${app.status} ${isDyeing ? 'cal-event--dyeing' : ''} ${appPast ? 'cal-event--completed-auto' : ''}`}
                                                onClick={isDyeing ? () => setCalcApp(app) : undefined}
                                                title={isDyeing ? 'Розрахувати вартість фарбування' : undefined}
                                            >
                                                <span className="cal-event__time">{formatTime(app.time)}</span>
                                                <span className="cal-event__name">{app.client?.name || 'Клієнт'}</span>
                                                <span className="cal-event__service">{app.service?.name}</span>
                                                {isDyeing && <span className="cal-event__dye-icon material-symbols-rounded">palette</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Робочі години */}
            <div className="master-dash__work-hours">
                <button className="work-hours-toggle" onClick={() => setShowHours(h => !h)}>
                    <span className="material-symbols-rounded">schedule</span>
                    Робочі години
                    <span className="material-symbols-rounded toggle-arrow">
                        {showHours ? 'expand_less' : 'expand_more'}
                    </span>
                </button>
                {showHours && (
                    <div className="work-hours-panel">
                        {[1,2,3,4,5,6,0].map(dayIndex => {
                            const label = JS_TO_UK[dayIndex];
                            const h = workHours[String(dayIndex)];
                            return (
                                <div key={dayIndex} className={`wh-row ${!h.active ? 'wh-row--off' : ''}`}>
                                    <label className="wh-toggle">
                                        <input type="checkbox" checked={h?.active}
                                               onChange={e => handleHourChange(dayIndex, 'active', e.target.checked)} />
                                        <span className="wh-toggle__track" />
                                        <span className="wh-day">{label}</span>
                                    </label>
                                    {h?.active ? (
                                        <div className="wh-times">
                                            <input type="text" list="hours-list" placeholder="09:00" value={h.start} className="wh-input"
                                                   onChange={e => handleHourChange(dayIndex, 'start', e.target.value)} />
                                            <span className="wh-sep">—</span>
                                            <input type="text" list="hours-list" placeholder="18:00" value={h.end} className="wh-input"
                                                   onChange={e => handleHourChange(dayIndex, 'end', e.target.value)} />
                                        </div>
                                    ) : (
                                        <span className="wh-off-text">вихідний</span>
                                    )}
                                </div>
                            );
                        })}
                        <button className="wh-save-btn" onClick={handleSaveHours}>
                            {hoursSaved
                                ? <><span className="material-symbols-rounded">check</span>Збережено</>
                                : <><span className="material-symbols-rounded">save</span>Зберегти</>
                            }
                        </button>
                    </div>
                )}
            </div>

            <datalist id="hours-list">
                {["08:00","09:00","10:00","11:00","12:00","13:00","14:00","15:00","16:00","17:00","18:00","19:00","20:00"].map(t => <option key={t} value={t}/>)}
            </datalist>

            <button className="full-calendar-btn" onClick={() => window.location.href='/calendar'}>
                <span className="material-symbols-rounded">calendar_month</span>
                Відкрити повний календар
            </button>

            {calcApp && <DyeingCalculator appointment={calcApp} onClose={() => setCalcApp(null)} />}
        </div>
    );
};