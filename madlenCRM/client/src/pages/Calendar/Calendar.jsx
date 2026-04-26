import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/';
import './Calendar.scss';

export default function Calendar() {
    const [staff, setStaff] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(true);
    const [dragOverSlot, setDragOverSlot] = useState(null); // { staffId, time, onApp? }


    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newApp, setNewApp] = useState({ staff: '', time: '', clientName: '', phone: '+380', service: '', comment: '' });
    const [filterCategory, setFilterCategory] = useState('all');
    // Модалка перегляду запису
    const [viewApp, setViewApp] = useState(null);
    // Кастомний датпікер
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [pickerMonth, setPickerMonth] = useState(new Date());
    const datePickerRef = useRef(null);
    const [dragOverApp, setDragOverApp] = useState(null); // { appId }
// Додай поруч з іншими useState
    const isDraggingOverApp = useRef(false);
    // Лінія поточного часу
    const [nowTop, setNowTop] = useState(null);
    const CELL_HEIGHT = 50;
    const START_HOUR = 9;

    useEffect(() => {
        const calcNow = () => {
            const now = new Date();
            const totalMinutes = (now.getHours() - START_HOUR) * 60 + now.getMinutes();
            if (totalMinutes < 0 || totalMinutes > (21 - START_HOUR) * 60 + 60) {
                setNowTop(null);
                return;
            }
            // Кожні 20 хв = 50px
            const top = (totalMinutes / 20) * CELL_HEIGHT;
            setNowTop(top);
        };
        calcNow();
        const timer = setInterval(calcNow, 60000);
        return () => clearInterval(timer);
    }, []);

    // Закрити датпікер при кліку поза ним
    useEffect(() => {
        const handler = (e) => {
            if (datePickerRef.current && !datePickerRef.current.contains(e.target)) {
                setShowDatePicker(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => {
        fetchData();
        api.get('/services').then(res => setServices(res.data));
    }, [selectedDate]);

    const fetchData = async () => {
        try {
            const [staffRes, appsRes] = await Promise.all([
                api.get('/staff'),
                api.get('/appointments/all')
            ]);
            setStaff(staffRes.data);
            setAppointments(appsRes.data);
            setLoading(false);
        } catch (err) { setLoading(false); }
    };

    // Телефонна маска
    const handlePhoneChange = (e) => {
        let val = e.target.value;
        if (!val.startsWith('+380')) val = '+380';
        const digits = val.replace(/\D/g, '').slice(0, 12);
        let formatted = '+';
        if (digits.length > 0) formatted += digits.slice(0, 3);
        if (digits.length > 3) formatted += ' (' + digits.slice(3, 5);
        if (digits.length > 5) formatted += ') ' + digits.slice(5, 8);
        if (digits.length > 8) formatted += '-' + digits.slice(8, 10);
        if (digits.length > 10) formatted += '-' + digits.slice(10, 12);
        setNewApp({ ...newApp, phone: formatted });
    };

    const handleCreateApp = async () => {
        try {
            // 1. Знаходимо послугу в масиві services, щоб взяти її тривалість
            const selectedService = services.find(s => s._id === newApp.service);
            // Важливо: перетворюємо в Number, бо з інпутів може прийти рядок
            const durationValue = selectedService ? Number(selectedService.duration) : 20;

            const appointmentData = {
                staff: newApp.staff,
                service: newApp.service,
                clientName: newApp.clientName,
                phone: newApp.phone.replace(/\D/g, ''),
                date: selectedDate,
                time: newApp.time,
                comment: newApp.comment,
                duration: durationValue // Передаємо вирахувану тривалість
            };

            await api.post('/appointments', appointmentData);

            setIsModalOpen(false);
            setNewApp({ staff: '', time: '', clientName: '', phone: '+380', service: '', comment: '' });
            fetchData();
        } catch (err) {
            console.error("Помилка:", err);
            alert("Помилка при створенні запису");
        }
    };



    
    // Тиждень
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() + i);
        weekDays.push(d);
    }

    const timeLabels = [];
    for (let h = 9; h <= 21; h++) {
        for (let m = 0; m < 60; m += 20) {
            timeLabels.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
        }
    }

    // Drag & Drop
    const handleDragStart = (e, appId) => {
        e.dataTransfer.setData("appId", appId);
        e.currentTarget.classList.add('is-dragging');
    };
    const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('is-dragging');
    };

    // Кастомний датпікер
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    const handlePickDay = (day) => {
        if (!day) return;
        const y = pickerMonth.getFullYear();
        const m = String(pickerMonth.getMonth() + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        setSelectedDate(`${y}-${m}-${d}`);
        setShowDatePicker(false);
    };

    const pickerDays = getDaysInMonth(pickerMonth);
    const monthNames = ['Січень','Лютий','Березень','Квітень','Травень','Червень','Липень','Серпень','Вересень','Жовтень','Листопад','Грудень'];
    const dayNames = ['Нд','Пн','Вт','Ср','Чт','Пт','Сб'];

    const formatDisplayDate = (iso) => {
        const [y, m, d] = iso.split('-');
        return `${d}.${m}.${y}`;
    };

    // Знайти майстра по запису
    const findMasterName = (app) => {
        if (app.masterName) return app.masterName;
        const s = staff.find(s => s._id.toString() === (app.staffId || app.staff || '').toString());
        return s ? s.name : 'Майстер';
    };

    const getAppStyles = (app, master, allMasterApps, dragOverSlot) => {
        if (!app || !app.time) return { display: 'none' };

        // 1. Отримуємо ID (пробуємо всі варіанти, де він може ховатися)
        const serviceId = (app.serviceId || app.service?._id || app.service || "").toString();

        console.log(`[DEBUG] Перевірка для ${app.clientName}: serviceId = "${serviceId}"`);

        // 2. Шукаємо в майстра
        const masterCustomDuration = master?.specializations ? master.specializations[serviceId] : null;

        const duration = Number(masterCustomDuration) || Number(app.duration) || 20;
        // --- ЛОГУВАННЯ ДЛЯ ПЕРЕВІРКИ ---
        if (masterCustomDuration) {
            console.log(`✅ ТЕКСТ ЗЧИТАНО: ${app.clientName} отримує ${duration}хв від майстра ${master.name}`);
        } else {
            console.warn(`⚠️ НЕ ЗЧИТАНО: Для послуги ${serviceId} у майстра ${master.name} немає спец-часу.`);
        }

        const [h, m] = app.time.split(':').map(Number);
        const startMins = h * 60 + m;
        const startFromDayStart = (h - START_HOUR) * 60 + m;
        const endMins = startMins + duration;

        const top = (startFromDayStart / 20) * CELL_HEIGHT;
        const height = (duration / 20) * CELL_HEIGHT;

        // Решта логіки (накладки, колір)
        const isDyeing = /фарб|color|малюв|dye/i.test(app.serviceName || app.service?.name || '');

        const overlaps = allMasterApps.filter(other => {
            if (other._id === app._id || !other.time) return false;
            const [oh, om] = other.time.split(':').map(Number);
            const oStart = oh * 60 + om;
            const oServiceId = (other.service?._id || other.service || "").toString();
            const oDuration = Number(master?.specializations?.[oServiceId]) || Number(other.duration) || 20;
            return startMins < (oStart + oDuration) && endMins > oStart;
        });

        const isHovered = dragOverSlot &&
            dragOverSlot.staffId.toString() === (master._id || master).toString() &&
            (dragOverSlot.time === app.time || (dragOverSlot.onApp && isDyeing));

        const hasOverlap = overlaps.length > 0 || isHovered;

        let width = '97%';
        let left = '2px';
        let zIndex = 5;

        if (hasOverlap) {
            width = '48%';
            const allInConflict = [app, ...overlaps].sort((a, b) => {
                const aIsDye = /фарб|color|малюв/i.test(a.serviceName || a.service?.name || '');
                const bIsDye = /фарб|color|малюв/i.test(b.serviceName || b.service?.name || '');
                if (aIsDye !== bIsDye) return aIsDye ? -1 : 1;
                return a._id.toString().localeCompare(b._id.toString());
            });
            const myIndex = allInConflict.findIndex(item => item._id === app._id);
            if (myIndex > 0) left = '50%';
        }

        return {
            position: 'absolute',
            top: `${top}px`,
            height: `${height - 1}px`,
            width: width,
            left: left,
            zIndex: zIndex,
            // Використовуємо колір, який прийшов з бекенду (categoryColor)
            backgroundColor: `${app.categoryColor || '#D4AF37'}25`,
            borderLeft: `4px solid ${app.categoryColor || '#D4AF37'}`
        };
    };


    const handleDrop = async (e, targetStaffId, targetTime) => {
        e.preventDefault();
        const appId = e.dataTransfer.getData("appId");
        if (!appId) return;

        const draggingApp = appointments.find(a => a._id === appId);
        if (!draggingApp) return;

        const [h, m] = targetTime.split(':').map(Number);
        const newStart = h * 60 + m;

        // ОГОЛОШУЄМО duration ТУТ
        const currentDuration = Number(draggingApp.duration) || 20;
        const newEnd = newStart + currentDuration;

        const masterApps = appointments.filter(a =>
            (a.staff?._id || a.staff || a.staffId || "").toString() === targetStaffId.toString() &&
            a.date === selectedDate &&
            a._id !== appId
        );

        // Перевірки конфліктів (залишаються як були)
        const sameStart = masterApps.find(a => a.time === targetTime);
        if (sameStart) {
            alert("❌ Записи не можуть починатися в один і той самий час!");
            return;
        }

        const conflicts = masterApps.filter(other => {
            const [oh, om] = other.time.split(':').map(Number);
            const oStart = oh * 60 + om;
            const oDuration = Number(other.duration) || 20;
            return newStart < (oStart + oDuration) && newEnd > oStart;
        });

        if (conflicts.length > 0) {
            const isDraggingDyeing = /фарб|color|малюв|dye/i.test(draggingApp.serviceName || draggingApp.service?.name || "");
            const hasDyeingInConflict = conflicts.some(c => /фарб|color|малюв|dye/i.test(c.serviceName || c.service?.name || ""));
            const canOverlap = (isDraggingDyeing && !hasDyeingInConflict) || (!isDraggingDyeing && hasDyeingInConflict);

            if (!canOverlap || conflicts.length >= 2) {
                alert("❌ Накладка можлива тільки стрижки на фарбування!");
                return;
            }
        }

        // Оптимістичне оновлення
        setAppointments(prev => prev.map(a =>
            a._id === appId ? { ...a, staff: targetStaffId, staffId: targetStaffId, time: targetTime, date: selectedDate } : a
        ));

        try {
            await api.patch(`/appointments/${appId}`, {
                staff: targetStaffId,
                time: targetTime,
                date: selectedDate,
                duration: currentDuration // ТЕПЕР ПЕРЕДАЄМО ПРАВИЛЬНУ ЗМІННУ
            });
            fetchData();
        } catch (err) {
            alert("Помилка сервера");
            fetchData();
        }
    };



    if (loading) return <div className="dash-loader">Madlen CRM...</div>;

    return (
        <div className="altegio-clean">
            <header className="cal-header">
                <div className="left">
                    <div className="week-btns">
                        {weekDays.map(d => {
                            const iso = d.toISOString().split('T')[0];
                            const isToday = iso === new Date().toISOString().split('T')[0];
                            return (
                                <button
                                    key={iso}
                                    className={`day-btn ${selectedDate === iso ? 'active' : ''} ${isToday ? 'today' : ''}`}
                                    onClick={() => setSelectedDate(iso)}
                                >
                                    <span className="dow">{d.toLocaleDateString('uk-UA', { weekday: 'short' })}</span>
                                    <span className="num">{d.getDate()}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Кастомний датпікер */}
                    <div className="custom-datepicker-wrap" ref={datePickerRef}>
                        <button className="date-display" onClick={() => setShowDatePicker(v => !v)}>
                            <span className="cal-icon">📅</span>
                            {formatDisplayDate(selectedDate)}
                        </button>
                        {showDatePicker && (
                            <div className="date-picker-dropdown">
                                <div className="picker-nav">
                                    <button onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1))}>‹</button>
                                    <span>{monthNames[pickerMonth.getMonth()]} {pickerMonth.getFullYear()}</span>
                                    <button onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1))}>›</button>
                                </div>
                                <div className="picker-grid">
                                    {dayNames.map(dn => <div key={dn} className="picker-dayname">{dn}</div>)}
                                    {pickerDays.map((day, i) => {
                                        if (!day) return <div key={`empty-${i}`} />;
                                        const y = pickerMonth.getFullYear();
                                        const m = String(pickerMonth.getMonth() + 1).padStart(2, '0');
                                        const iso = `${y}-${m}-${String(day).padStart(2, '0')}`;
                                        const isSelected = iso === selectedDate;
                                        const isTodayDay = iso === new Date().toISOString().split('T')[0];
                                        return (
                                            <div
                                                key={day}
                                                className={`picker-day ${isSelected ? 'selected' : ''} ${isTodayDay ? 'today' : ''}`}
                                                onClick={() => handlePickDay(day)}
                                            >
                                                {day}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <select
                    className="category-filter"
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                >
                    <option value="all">🌈 Всі послуги</option>
                    <option value="haircut">✂️ Стрижки</option>
                    <option value="dyeing">🎨 Фарбування</option>
                    <option value="makeup">💄 Візаж</option>
                    <option value="manicure">💅 Манікюр</option>
                    <option value="other">⚙️ Інше</option>
                </select>

                <button className="today-btn" onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}>Сьогодні</button>
            </header>

            <div className="viewport">
                <div className="time-axis">
                    <div className="corner" />
                    {timeLabels.map(t => (
                        <div key={t} className={`t-slot ${t.endsWith(':00') ? 'hour' : 'min'}`}>
                            {t.endsWith(':00') ? <b>{t.split(':')[0]}<sup>00</sup></b> : <i>{t.split(':')[1]}</i>}
                        </div>
                    ))}
                </div>

                <div className="masters-container" style={{ gridTemplateColumns: `repeat(${staff.length}, minmax(220px, 1fr))` }}>
                    {staff.map(m => (
                        <div key={m._id} className="m-column">
                            <div className="m-head">
                                <div className="avatar">
                                    {m.avatar
                                        ? <img src={m.avatar.startsWith('http') ? m.avatar : `https://madlencrm-backend.onrender.com/${m.avatar}`} alt="" />
                                        : m.name[0]}
                                </div>
                                <div className="info">
                                    <span className="name">{m.name}</span>
                                    <span className="role">{m.role || 'Майстер'}</span>
                                </div>
                            </div>

                            <div className="slots" style={{ position: 'relative', minHeight: `${timeLabels.length * CELL_HEIGHT}px` }}>
                                {/* 1. Сітка (клітинки) */}
                                {timeLabels.map(time => (
                                    <div
                                        key={time}
                                        className="cell"
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            // Якщо ми тягнемо над існуючим записом, не підсвічуємо клітинку під ним
                                            if (isDraggingOverApp.current) return;

                                            e.currentTarget.classList.add('drag-over');
                                            if (dragOverSlot?.time !== time || dragOverSlot?.staffId !== m._id) {
                                                setDragOverSlot({ staffId: m._id, time: time, onApp: false });
                                            }
                                        }}
                                        onDragLeave={(e) => {
                                            // Використовуємо target щоб уникнути мерехтіння при переході на плюс-хінт
                                            if (e.currentTarget.contains(e.relatedTarget)) return;

                                            e.currentTarget.classList.remove('drag-over');
                                            setDragOverSlot(null);
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('drag-over');

                                            // Скидаємо стани перетягування
                                            isDraggingOverApp.current = false;
                                            setDragOverSlot(null);

                                            // Вираховуємо точний час скидання (Drop)
                                            const slotsEl = e.currentTarget.closest('.slots');
                                            const rect = slotsEl.getBoundingClientRect();
                                            const relY = e.clientY - rect.top;
                                            const slotIndex = Math.floor(relY / CELL_HEIGHT);
                                            const dropTime = timeLabels[Math.max(0, Math.min(slotIndex, timeLabels.length - 1))];

                                            handleDrop(e, m._id, dropTime);
                                        }}
                                        onClick={() => {
                                            setNewApp({...newApp, staff: m._id, time});
                                            setIsModalOpen(true);
                                        }}
                                    >
                                        <div className="plus-hint">+</div>
                                    </div>
                                ))}
                                {/* 2. Лінія поточного часу */}
                                {nowTop !== null && selectedDate === new Date().toISOString().split('T')[0] && (
                                    <div className="now-line" style={{ top: `${nowTop}px` }}>
                                        <div className="now-dot" />
                                    </div>
                                )}

                                {/* 3. ЗАПИСИ (з фільтрацією категорій) */}


                                {/* 3. ЗАПИСИ (з виправленням кольорів) */}
                                {/* 3. ЗАПИСИ (masterApps) */}
                                {/* 3. ЗАПИСИ (masterApps) */}
                                {/* 3. ЗАПИСИ (masterApps) */}
                                {(() => {
                                    const masterApps = appointments.filter(a => {
                                        const isMyMaster = (a.staff?._id || a.staff || a.staffId || "").toString() === m._id.toString();
                                        const isMyDate = a.date === selectedDate;

                                        // Визначаємо категорію для фільтрації
                                        const finalCat = a.service?.category?.slug || a.service?.category || 'other';
                                        const matchesFilter = filterCategory === 'all' || finalCat === filterCategory;

                                        return isMyMaster && isMyDate && matchesFilter;
                                    });

                                    return masterApps.map(app => {
                                        // ДИНАМІЧНИЙ КОЛІР: Беремо колір з категорії через послугу
                                        // Якщо populate на бекенді працює, тут буде колір, інакше — золото за дефолтом
                                        const categoryColor = app.categoryColor || '#D4AF37';

                                        return (
                                            <div
                                                key={app._id}
                                                className="app-row"
                                                style={{
                                                    ...getAppStyles(app, m, masterApps, dragOverSlot),
                                                    backgroundColor: `${app.categoryColor || '#D4AF37'}25`,
                                                    borderLeft: `4px solid ${app.categoryColor || '#D4AF37'}`,
                                                    pointerEvents: dragOverSlot ? 'auto' : 'auto'
                                                }}
                                                draggable="true"
                                                onDragOver={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const isDyeingTarget = /фарб|color|малюв|dye/i.test(app.serviceName || '');
                                                    if (isDyeingTarget) {
                                                        setDragOverApp({ appId: app._id });
                                                        // НЕ чіпаємо dragOverSlot — щоб не змінювати ширину блоку
                                                    }
                                                }}
                                                onDragLeave={(e) => {
                                                    e.stopPropagation();
                                                    setDragOverApp(null);
                                                }}
                                                onDrop={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    const isDyeingTarget = /фарб|color|малюв|dye/i.test(app.serviceName || '');
                                                    if (isDyeingTarget) {
                                                        setDragOverApp(null);
                                                        handleDrop(e, m._id, app.time);
                                                    }
                                                }}
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData("appId", app._id);
                                                    setTimeout(() => e.target.style.opacity = "0.5", 0);
                                                }}
                                                onDragEnd={(e) => {
                                                    e.target.style.opacity = "1";
                                                    setDragOverSlot(null);
                                                }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setViewApp({ ...app, masterName: m.name });
                                                }}
                                            >
                                                <div className="app-time-tag" style={{ color: app.categoryColor || '#D4AF37' }}>{app.time}</div>
                                                <div className="app-client-name">{app.clientName}</div>
                                                <div className="app-service-name">{app.serviceName}</div>
                                            </div>
                                        );
                                    });
                                })()}


                            </div>
                        </div>
                    ))}
                </div>

            </div>

            {/* Модалка створення запису */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Швидкий запис</h3>
                            <span className="time-badge">{newApp.time}</span>
                        </div>
                        <div className="form-grid">
                            <input type="text" placeholder="Ім'я клієнта" value={newApp.clientName} onChange={e => setNewApp({...newApp, clientName: e.target.value})} />
                            <input type="tel" placeholder="Телефон" value={newApp.phone} onChange={handlePhoneChange} />
                            <select value={newApp.service} onChange={e => setNewApp({...newApp, service: e.target.value})}>
                                <option value="">Оберіть послугу</option>
                                {services.map(s => <option key={s._id} value={s._id}>{s.name} — {s.price}₴</option>)}
                            </select>
                            <textarea placeholder="Коментар..." value={newApp.comment} onChange={e => setNewApp({...newApp, comment: e.target.value})} rows="2" />
                        </div>
                        <div className="modal-btns">
                            <button className="save-btn" onClick={handleCreateApp}>Записати</button>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>Скасувати</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Модалка перегляду запису */}
            {viewApp && (
                <div className="modal-overlay" onClick={() => setViewApp(null)}>
                    <div className="view-modal" onClick={e => e.stopPropagation()}>
                        <button className="view-close" onClick={() => setViewApp(null)}>✕</button>

                        <div className="view-status-bar">
                            <span className={`status-chip status-${viewApp.status || 'pending'}`}>
                                {{ pending: '⏳ Очікує', confirmed: '✅ Підтверджено', cancelled: '❌ Скасовано', completed: '✔ Завершено' }[viewApp.status] || '⏳ Очікує'}
                            </span>
                        </div>

                        <div className="view-hero">
                            <div className="view-time-block">
                                <span className="view-time">{viewApp.time}</span>
                                <span className="view-date">{formatDisplayDate(viewApp.date)}</span>
                            </div>
                            <div className="view-divider" />
                            <div className="view-client-block">
                                <span className="view-label">Клієнт</span>
                                <span className="view-client-name">{viewApp.clientName || 'Не вказано'}</span>
                                {viewApp.phone && <a className="view-phone" href={`tel:+${viewApp.phone}`}>📞 +{viewApp.phone}</a>}
                            </div>
                        </div>

                        <div className="view-details">
                            <div className="view-detail-row">
                                <span className="vd-label">Категорія</span>
                                <span className="vd-value">{viewApp.categoryName}</span>
                            </div>
                            <div className="view-detail-row">
                                <span className="vd-label">Послуга</span>
                                <span className="vd-value">{viewApp.serviceName}</span>
                            </div>
                            {viewApp.comment && (
                                <div className="view-detail-row">
                                    <span className="vd-label">Коментар</span>
                                    <span className="vd-value comment">{viewApp.comment}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}