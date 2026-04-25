import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/';
import { useAuthStore } from '../../store/authStore';
import './Booking.scss';

// Точна генерація слотів з урахуванням тривалості послуги
function generateSlots(start, end, durationMinutes = 60) {
    if (!start || !end) return [];

    const slots = [];
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);

    let cur = sh * 60 + sm;
    let endMin = eh * 60 + em;

    // Якщо робочий день закінчується після опівночі (напр. до 02:00)
    if (endMin <= cur) endMin += 1440;

    const step = Number(durationMinutes) > 0 ? Number(durationMinutes) : 60;

    // Важливо: слот додається тільки якщо послуга ВСТИГАЄ завершитися до кінця робочого дня
    while (cur + step <= endMin) {
        const h = String(Math.floor(cur / 60) % 24).padStart(2, '0');
        const m = String(cur % 60).padStart(2, '0');
        slots.push(`${h}:${m}`);
        cur += step;
    }
    return slots;
}

function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }

const MONTH_UA = ['Січень','Лютий','Березень','Квітень','Травень','Червень',
    'Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
const DAY_UA = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];

export default function Booking() {
    const { state } = useLocation();
    const navigate  = useNavigate();
    const { user }  = useAuthStore();

    const [step, setStep] = useState(1);
    const [services, setServices]     = useState([]);
    const [staff, setStaff]           = useState([]);
    const [bookedSlots, setBookedSlots] = useState([]);
    const [workHours, setWorkHours]   = useState(null);

    const [selectedService, setSelectedService] = useState(state?.service || null);
    const [selectedStaff, setSelectedStaff]     = useState(null);
    const [selectedDate, setSelectedDate]       = useState(null);
    const [selectedTime, setSelectedTime]       = useState(null);
    const [comment, setComment]   = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess]   = useState(false);
    const [error, setError]       = useState('');

    const today = new Date();
    const [calYear, setCalYear]   = useState(today.getFullYear());
    const [calMonth, setCalMonth] = useState(today.getMonth());

    useEffect(() => {
        api.get('/services').then(r => setServices(r.data)).catch(() => {});
        api.get('/staff').then(r => setStaff(r.data)).catch(() => {});
    }, []);

    useEffect(() => {
        if (state?.service) {
            setSelectedService(state.service);
            setStep(2);
        }
    }, [state]);

    // Отримання слотів при зміні майстра або дати
    useEffect(() => {
        if (selectedStaff && selectedDate) {
            const dateStr = formatDate(selectedDate);
            console.log(`📡 Запит слотів на ${dateStr} для майстра ${selectedStaff.name}`);

            api.get(`/appointments/slots?staffId=${selectedStaff._id}&date=${dateStr}`)
                .then(r => {
                    console.log("📥 Отримано дані графіку:", r.data);
                    setBookedSlots(r.data.bookedSlots || []);
                    // Примусово оновлюємо workHours новими даними з бекенду
                    setWorkHours(r.data.workHours);
                })
                .catch(err => {
                    console.error("Помилка завантаження слотів", err);
                    setBookedSlots([]);
                });
        }
    }, [selectedStaff, selectedDate]);

    // Скидання при зміні майстра
    useEffect(() => {
        setSelectedDate(null);
        setSelectedTime(null);
        setWorkHours(null);
        setBookedSlots([]);
    }, [selectedStaff]);

    const formatDate = (d) => {
        const dd = String(d.getDate()).padStart(2,'0');
        const mm = String(d.getMonth()+1).padStart(2,'0');
        return `${d.getFullYear()}-${mm}-${dd}`;
    };

    const formatDateUA = (d) => {
        if (!d) return '';
        return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
    };

    const isWorkDay = (date, hours) => {
        if (!hours) return true;
        const dayKey = String(date.getDay());
        return hours[dayKey]?.active === true;
    };

    // Генерація слотів на основі отриманих workHours
    const availableSlots = (() => {
        if (!selectedDate || !workHours || !selectedService) return [];

        const dayKey = String(selectedDate.getDay());
        const h = workHours[dayKey];

        if (!h || h.active === false) return [];

        console.log(`⚙️ Генеруємо слоти для дня ${dayKey} (${h.start} - ${h.end})`);
        return generateSlots(h.start, h.end, selectedService.duration);
    })();

    const daysInMonth = getDaysInMonth(calYear, calMonth);
    const firstDay    = getFirstDayOfMonth(calYear, calMonth);
    const offset      = firstDay === 0 ? 6 : firstDay - 1;
    const calCells    = Array(offset).fill(null).concat(
        Array.from({ length: daysInMonth }, (_, i) => new Date(calYear, calMonth, i + 1))
    );

    const isPast = (d) => {
        const t = new Date(); t.setHours(0,0,0,0);
        return d < t;
    };
    const isSameDay = (a, b) => a && b &&
        a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();

    const prevMonth = () => {
        if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); }
        else setCalMonth(m => m-1);
        setSelectedDate(null); setSelectedTime(null);
    };
    const nextMonth = () => {
        if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); }
        else setCalMonth(m => m+1);
        setSelectedDate(null); setSelectedTime(null);
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        setError('');
        try {
            await api.post('/appointments', {
                serviceId: selectedService._id,
                staffId:   selectedStaff._id,
                date:      formatDate(selectedDate),
                time:      selectedTime,
                comment,
            });
            setSuccess(true);
        } catch (err) {
            setError(err.response?.data?.message || 'Помилка при записі');
        }
        setSubmitting(false);
    };

    if (success) return (
        <div className="booking-page">
            <div className="booking-success">
                <div className="success-icon">✦</div>
                <h2>Запис підтверджено!</h2>
                <p>Чекаємо вас <strong>{formatDateUA(selectedDate)}</strong> о <strong>{selectedTime}</strong></p>
                <p className="success-sub">Послуга: {selectedService.name} · Майстер: {selectedStaff.name}</p>
                <button className="btn-gold" onClick={() => navigate('/services')}>На головну</button>
            </div>
        </div>
    );

    return (
        <div className="booking-page">
            <div className="booking-progress">
                {['Послуга','Майстер','Дата і час','Підтвердження'].map((label, i) => (
                    <div key={i} className={`progress-step ${step > i+1 ? 'done' : ''} ${step === i+1 ? 'active' : ''}`}>
                        <div className="step-dot">{step > i+1 ? '✓' : i+1}</div>
                        <span>{label}</span>
                    </div>
                ))}
            </div>

            <div className="booking-body">
                {step === 1 && (
                    <div className="booking-step">
                        <h2>Оберіть послугу</h2>
                        <div className="pick-grid">
                            {services.map(s => (
                                <div key={s._id}
                                     className={`pick-card ${selectedService?._id === s._id ? 'selected' : ''}`}
                                     onClick={() => setSelectedService(s)}
                                >
                                    <span className="pick-cat">{s.category}</span>
                                    <h3>{s.name}</h3>
                                    <div className="pick-foot">
                                        <span>{s.price} ₴</span>
                                        {s.duration && <span>{s.duration} хв</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="step-actions">
                            <button className="btn-gold" disabled={!selectedService} onClick={() => setStep(2)}>Далі →</button>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="booking-step">
                        <h2>Оберіть майстра</h2>
                        <div className="staff-pick-grid">
                            {staff.map(m => (
                                <div key={m._id}
                                     className={`staff-pick-card ${selectedStaff?._id === m._id ? 'selected' : ''}`}
                                     onClick={() => setSelectedStaff(m)}
                                >
                                    <div className="staff-avatar">
                                        {m.avatar
                                            ? <img src={`http://localhost:5000/${m.avatar}`} alt={m.name} />
                                            : m.name.charAt(0)
                                        }
                                    </div>
                                    <h3>{m.name}</h3>
                                    <span>{m.role}</span>
                                </div>
                            ))}
                        </div>
                        <div className="step-actions">
                            <button className="btn-outline" onClick={() => setStep(1)}>← Назад</button>
                            <button className="btn-gold" disabled={!selectedStaff} onClick={() => setStep(3)}>Далі →</button>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="booking-step step-datetime">
                        <div className="calendar-wrap">
                            <h2>Оберіть дату</h2>
                            <div className="calendar">
                                <div className="cal-header">
                                    <button onClick={prevMonth}>‹</button>
                                    <span>{MONTH_UA[calMonth]} {calYear}</span>
                                    <button onClick={nextMonth}>›</button>
                                </div>
                                <div className="cal-grid">
                                    {DAY_UA.map(d => <div key={d} className="cal-day-name">{d}</div>)}
                                    {calCells.map((d, i) => {
                                        const isOff = d && workHours && !isWorkDay(d, workHours);
                                        return (
                                            <div key={i}
                                                 className={`cal-cell
                                                    ${!d ? 'empty' : ''}
                                                    ${d && isPast(d) ? 'past' : ''}
                                                    ${d && isSameDay(d, selectedDate) ? 'selected' : ''}
                                                    ${isOff ? 'day-off' : ''}
                                                `}
                                                 onClick={() => {
                                                     if (d && !isPast(d) && !isOff) {
                                                         setSelectedDate(d);
                                                         setSelectedTime(null);
                                                     }
                                                 }}
                                            >
                                                {d ? d.getDate() : ''}
                                                {isOff && <span className="day-off-dot" title="вихідний" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="time-wrap">
                            <h2>Оберіть час</h2>
                            <p className="duration-hint">Тривалість послуги: <strong>{selectedService?.duration} хв</strong></p>
                            {!selectedDate ? (
                                <p className="hint">Спочатку оберіть дату</p>
                            ) : (availableSlots && availableSlots.length === 0) ? (
                                <p className="hint">На жаль, вільних вікон немає</p>
                            ) : (
                                <div className="time-grid">
                                    {availableSlots.map(t => {
                                        const booked = bookedSlots.includes(t);
                                        return (
                                            <button key={t}
                                                    className={`time-slot ${booked ? 'booked' : ''} ${selectedTime === t ? 'selected' : ''}`}
                                                    disabled={booked}
                                                    onClick={() => setSelectedTime(t)}
                                            >
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="step-actions full">
                            <button className="btn-outline" onClick={() => setStep(2)}>← Назад</button>
                            <button className="btn-gold" disabled={!selectedDate || !selectedTime} onClick={() => setStep(4)}>Далі →</button>
                        </div>
                    </div>
                )}

                {step === 4 && (
                    <div className="booking-step">
                        <h2>Підтвердження запису</h2>
                        <div className="confirm-card">
                            <div className="confirm-row">
                                <span>Послуга</span>
                                <strong>{selectedService?.name}</strong>
                            </div>
                            <div className="confirm-row">
                                <span>Майстер</span>
                                <strong>{selectedStaff?.name}</strong>
                            </div>
                            <div className="confirm-row">
                                <span>Дата та час</span>
                                <strong>{formatDateUA(selectedDate)} о {selectedTime}</strong>
                            </div>
                            <div className="confirm-row">
                                <span>Вартість</span>
                                <strong style={{color: '#D4AF37', fontSize: '1.2rem'}}>{selectedService?.price} ₴</strong>
                            </div>
                        </div>
                        <textarea className="comment-input"
                                  placeholder="Коментар (необов'язково)..."
                                  value={comment}
                                  onChange={e => setComment(e.target.value)}
                        />
                        {error && <div className="booking-error">{error}</div>}
                        <div className="step-actions">
                            <button className="btn-outline" onClick={() => setStep(3)}>← Назад</button>
                            <button className="btn-gold" disabled={submitting} onClick={handleSubmit}>
                                {submitting ? '...' : 'Підтвердити запис'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}