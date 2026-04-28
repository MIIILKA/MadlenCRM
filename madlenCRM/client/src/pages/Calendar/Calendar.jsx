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
    const [categories, setCategories] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newApp, setNewApp] = useState({ staff: '', time: '', clientName: '', phone: '+380', service: '', comment: '' });
    const [filterCategory, setFilterCategory] = useState('all');
    // Модалка перегляду запису
    const [viewApp, setViewApp] = useState(null);
    const [adminSettings, setAdminSettings] = useState({ dyePriceGram: 15 }); // Ціна за грам за замовчуванням
    const [dyeingDetails, setDyeingDetails] = useState({
        formula: '',
        hairLength: 'medium', // short, medium, long
        density: 'medium',    // low, medium, high
        technique: 'one-tone' // one-tone, balayage, airtouch
    });    // Кастомний датпікер

    const [pricing, setPricing] = useState({ dye: 15, oxid: 5, supplies: 50 });



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
    useEffect(() => {
        api.get('/paint-settings')
            .then(res => {
                if (res.data.pricing) setPricing(res.data.pricing);
            })
            .catch(err => console.error("Не вдалося завантажити ціни для календаря"));
    }, []);
    // Додай цей стейт до інших

    const fetchData = async () => {
        try {
            const [staffRes, appsRes, catRes] = await Promise.all([
                api.get('/staff'),
                api.get('/appointments/all'),
                api.get('/categories').catch(() => ({ data: [] })) // Захист від помилки 404
            ]);
            setStaff(staffRes.data);
            setAppointments(appsRes.data);
            setCategories(catRes.data); // Тепер категорії будуть у стейті
            setLoading(false);
        } catch (err) {
            console.error("Помилка завантаження даних:", err);
            setLoading(false);
        }
    };

    const filteredByStatusAndCategory = React.useMemo(() => {
        return appointments.filter(a => {
            if (a.status === 'cancelled') return false;
            if (filterCategory === 'all') return true;

            // Бекенд повертає плоскі поля, не вкладений об'єкт
            const appCategoryName = (a.categoryName || "").toLowerCase().trim();

            // filterCategory — це _id категорії (з select)
            // Знаходимо категорію по _id і порівнюємо name
            const selectedCat = categories.find(c => c._id === filterCategory);
            if (!selectedCat) return false;

            return appCategoryName === selectedCat.name.toLowerCase().trim();
        });
    }, [appointments, filterCategory, categories]);





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


            const [h, m] = newApp.time.split(':').map(Number);
            const newStart = h * 60 + m;
            const newEnd = newStart + durationValue;

            const hasConflict = appointments.some(a => {
                const isSameDate = (a.date.split('T')[0]) === selectedDate;
                const isSameMaster = (a.staff?._id || a.staff || "").toString() === newApp.staff.toString();
                if (!isSameDate || !isSameMaster || a.status === 'cancelled') return false;

                const [ah, am] = a.time.split(':').map(Number);
                const aStart = ah * 60 + am;
                const aEnd = aStart + (Number(a.duration) || 20);

                return newStart < aEnd && newEnd > aStart;
            });

            if (hasConflict) {
                alert("❌ У цього майстра цей час уже зайнятий!");
                return;
            }

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
        const newDate = `${y}-${m}-${d}`; // Рядок "2026-04-27"
        setSelectedDate(newDate);
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

        // --- ФІКС ДАТИ (UTC/Timezone issue) ---
        // Порівнюємо ТІЛЬКИ як рядки "2026-04-27" === "2026-04-27"
        // Не створюємо new Date(), щоб уникнути зміщення часового поясу Львова
        const appDateStr = String(app.date).split('T')[0].trim();
        const selectedDateStr = String(selectedDate).split('T')[0].trim();

        if (appDateStr !== selectedDateStr) {
            return { display: 'none' };
        }
        // ---------------------------------------

        // 1. Отримуємо ID послуги
        const serviceId = (app.serviceId || app.service?._id || app.service || "").toString();

        // 2. Шукаємо тривалість у майстра
        const masterCustomDuration = master?.specializations ? master.specializations[serviceId] : null;
        const duration = Number(masterCustomDuration) || Number(app.duration) || 20;

        // Розрахунок позиції по вертикалі (час)
        const [h, m] = app.time.split(':').map(Number);
        const startMins = h * 60 + m;
        const startFromDayStart = (h - START_HOUR) * 60 + m;
        const endMins = startMins + duration;

        const top = (startFromDayStart / 20) * CELL_HEIGHT;
        const height = (duration / 20) * CELL_HEIGHT;

        // Логіка накладок
        const isDyeing = /фарб|color|малюв|dye/i.test(app.serviceName || app.service?.name || '');

        const overlaps = allMasterApps.filter(other => {
            if (other._id === app._id || !other.time) return false;

            // Також перевіряємо дату для накладок (на всякий випадок)
            if (String(other.date).split('T')[0] !== appDateStr) return false;

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
            backgroundColor: `${app.categoryColor || '#D4AF37'}25`,
            borderLeft: `4px solid ${app.categoryColor || '#D4AF37'}`
        };
    };


    const handleDrop = async (e, targetStaffId, targetTime) => {
        e.preventDefault();
        const appId = e.dataTransfer.setData ? e.dataTransfer.getData("appId") : null;
        // Якщо setData не спрацював, спробуємо стандартний метод
        const id = appId || e.dataTransfer.getData("text/plain");

        if (!id) return;

        const draggingApp = appointments.find(a => a._id === id);
        if (!draggingApp) return;

        // 1. ПРИМУСОВА НОРМАЛІЗАЦІЯ ДАТИ (Фікс "впиздуватого" зміщення)
        let finalDateToSend = selectedDate;
        if (selectedDate instanceof Date) {
            const y = selectedDate.getFullYear();
            const mon = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const d = String(selectedDate.getDate()).padStart(2, '0');
            finalDateToSend = `${y}-${mon}-${d}`;
        } else if (typeof selectedDate === 'string') {
            finalDateToSend = selectedDate.split('T')[0];
        }

        // 2. Розрахунок часу
        const [h, m] = targetTime.split(':').map(Number);
        const newStart = h * 60 + m;
        const currentDuration = Number(draggingApp.duration) || 20;
        const newEnd = newStart + currentDuration;

        // 3. Фільтрація записів поточного майстра на вибрану дату
        const masterApps = appointments.filter(a => {
            const appDateStr = a.date.includes('T') ? a.date.split('T')[0] : a.date;
            const isMyDate = appDateStr.trim() === finalDateToSend.trim();
            const isMyMaster = (a.staff?._id || a.staff || "").toString() === targetStaffId.toString();
            return isMyMaster && isMyDate && a._id !== id;
        });

        // 4. Перевірка на "стик у стик" (щоб не починалися в одну хвилину)
        const sameStart = masterApps.find(a => a.time === targetTime);
        if (sameStart) {
            alert("❌ Тут уже починається інший запис!");
            return;
        }

        // 5. Перевірка на накладки (Стрижка + Фарбування)
        const conflicts = masterApps.filter(other => {
            const [oh, om] = other.time.split(':').map(Number);
            const oStart = oh * 60 + om;
            const oDuration = Number(other.duration) || 20;
            return newStart < (oStart + oDuration) && newEnd > oStart;
        });

        if (conflicts.length > 0) {
            const isDraggingDyeing = /фарб|color|малюв|dye/i.test(draggingApp.serviceName || "");
            const hasDyeingInConflict = conflicts.some(c => /фарб|color|малюв|dye/i.test(c.serviceName || ""));

            // Дозволяємо накладку тільки якщо один фарбується, а інший — ні
            const canOverlap = (isDraggingDyeing && !hasDyeingInConflict) || (!isDraggingDyeing && hasDyeingInConflict);

            if (!canOverlap || conflicts.length >= 2) {
                alert("❌ Накладка можлива тільки стрижки на фарбування!");
                return;
            }
        }

        // 6. Оптимістичне оновлення інтерфейсу
        setAppointments(prev => prev.map(a =>
            a._id === id ? { ...a, staff: targetStaffId, staffId: targetStaffId, time: targetTime, date: finalDateToSend } : a
        ));

        // 7. Відправка на сервер
        try {
            await api.patch(`/appointments/${id}`, {
                staff: targetStaffId,
                time: targetTime,
                date: finalDateToSend, // Шлемо чистий рядок "2026-04-27"
                duration: currentDuration
            });
            // Оновлюємо дані, щоб підтягнути всі populate з бекенду
            fetchData();
        } catch (err) {
            console.error("Patch error:", err);
            alert("Помилка при збереженні змін");
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
                    {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>
                            {cat.name}
                        </option>
                    ))}
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
                                {/* 1. Сітка */}
                                {timeLabels.map(time => (
                                    <div
                                        key={time}
                                        className="cell"
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            if (isDraggingOverApp.current) return;
                                            e.currentTarget.classList.add('drag-over');
                                            if (dragOverSlot?.time !== time || dragOverSlot?.staffId !== m._id) {
                                                setDragOverSlot({ staffId: m._id, time: time, onApp: false });
                                            }
                                        }}
                                        onDragLeave={(e) => {
                                            if (e.currentTarget.contains(e.relatedTarget)) return;
                                            e.currentTarget.classList.remove('drag-over');
                                            setDragOverSlot(null);
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            e.currentTarget.classList.remove('drag-over');
                                            isDraggingOverApp.current = false;
                                            setDragOverSlot(null);
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

                                {/* 2. Лінія поточного часу - ВИПРАВЛЕНО ПОРІВНЯННЯ */}
                                {nowTop !== null &&
                                    (typeof selectedDate === 'string' ? selectedDate : selectedDate.toISOString().split('T')[0]) === new Date().toISOString().split('T')[0] && (
                                        <div className="now-line" style={{ top: `${nowTop}px` }}>
                                            <div className="now-dot" />
                                        </div>
                                    )}

                                {/* 3. ЗАПИСИ */}
                                {(() => {
                                    // Формуємо чисту дату для порівняння
                                    let targetDateStr = typeof selectedDate === 'string'
                                        ? selectedDate.split('T')[0]
                                        : getLocalDateString(selectedDate);

                                    const masterApps = filteredByStatusAndCategory.filter(a => {
                                        const appDateStr = a.date.includes('T') ? a.date.split('T')[0] : a.date;
                                        const isMyMaster = (a.staff?._id || a.staff || a.staffId || "").toString() === m._id.toString();
                                        const isMyDate = appDateStr.trim() === targetDateStr.trim();
                                        return isMyMaster && isMyDate;
                                    });

                                    return masterApps.map(app => {
                                        const styles = getAppStyles(app, m, masterApps, dragOverSlot);
                                        if (styles.display === 'none') return null;

                                        const isDyeing = /фарб|color|малюв|dye/i.test(app.serviceName || "");

                                        return (
                                            <div
                                                key={app._id}
                                                className="app-row"
                                                style={styles}
                                                draggable="true"
                                                onDragStart={(e) => {
                                                    e.dataTransfer.setData("appId", app._id);
                                                    setTimeout(() => (e.target.style.opacity = "0.5"), 0);
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
                                                <div className="app-time-tag" style={{ color: app.categoryColor || '#D4AF37' }}>
                                                    {app.time}
                                                </div>
                                                <div className="app-client-name">{app.clientName}</div>
                                                <div className="app-service-name">{app.serviceName}</div>
                                                {isDyeing && <span className="dye-icon material-symbols-rounded">palette</span>}
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
                        {/* Кнопка скасування */}
                        {viewApp.status !== 'cancelled' && viewApp.status !== 'completed' && (
                            <button
                                onClick={async () => {
                                    if (!window.confirm('Скасувати цей запис?')) return;
                                    try {
                                        await api.patch(`/appointments/${viewApp._id}`, { status: 'cancelled' });
                                        setViewApp(null);
                                        fetchData();
                                    } catch (err) {
                                        alert('Помилка при скасуванні');
                                    }
                                }}
                                style={{
                                    width: '100%', marginTop: '12px', padding: '14px',
                                    borderRadius: '14px', background: 'transparent',
                                    border: '1px solid rgba(255,77,77,0.4)', color: '#ff4d4d',
                                    fontWeight: '800', fontSize: '11px', textTransform: 'uppercase',
                                    cursor: 'pointer', transition: '0.3s'
                                }}
                                onMouseEnter={e => e.target.style.background = 'rgba(255,77,77,0.1)'}
                                onMouseLeave={e => e.target.style.background = 'transparent'}
                            >
                                ✕ Скасувати запис
                            </button>
                        )}
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

                        {(() => {
                            // 1. Отримуємо всі послуги в один плоский масив для пошуку
                            const allServices = categories?.flatMap(cat => cat?.services || []) || [];

                            // 2. Нормалізуємо назву послуги з запису (видаляємо пробіли, малі літери)
                            const normalizedSearchName = viewApp?.serviceName?.trim()?.toLowerCase();
                            const currentService = services.find(s =>
                                (s?._id && (s._id === viewApp?.serviceId || s._id === viewApp?.service?._id || s._id === viewApp?.service)) ||
                                (s?.name?.trim()?.toLowerCase() === normalizedSearchName)
                            );
                            const washService = services.find(s =>
                                s?.name?.toLowerCase().includes('миття')
                            );

                            // 5. ФОРМУЄМО БАЗОВІ ЦІНИ (запис -> база -> 0)
                            const basePrice = Number(viewApp?.price) || Number(currentService?.price) || 0;
                            const dynamicWashPrice = Number(washService?.price) || 0;

                            // 6. ВИЗНАЧЕННЯ ТИПУ ТА ЛОГІКА МИТТЯ
                            const isColoring = /фарб|color|малюв|dye/i.test(viewApp?.serviceName || "");
                            const isHaircut = /стриж|cut/i.test(viewApp?.serviceName || "");

                            const needsWash = isColoring || dyeingDetails?.extraWash;
                            const washCost = needsWash ? dynamicWashPrice : 0;

                            // 7. РОЗРАХУНОК МАТЕРІАЛІВ (Тільки для фарбування)
                            let colorCost = 0; let oxidCost = 0; let suppliesCost = 0;
                            let finalG = 0; let finalOx = 0;

                            if (isColoring && pricing) {
                                const baseG = Number(pricing?.baseGrams?.[dyeingDetails.hairLength]) || 0;
                                const densC = Number(pricing?.densityCoef?.[dyeingDetails.density]) || 1;
                                const techC = Number(pricing?.techniqueCoef?.[dyeingDetails.technique]) || 1;

                                const autoGrams = Math.round(baseG * densC * techC);
                                finalG = dyeingDetails.manualGrams !== undefined ? Number(dyeingDetails.manualGrams) : autoGrams;
                                finalOx = dyeingDetails.manualOxid !== undefined ? Number(dyeingDetails.manualOxid) : (finalG * (dyeingDetails.technique === "one-tone" ? 1 : 2));

                                colorCost = finalG * (Number(pricing.dye) || 0);
                                oxidCost = finalOx * (Number(pricing.oxid) || 0);
                                suppliesCost = Number(pricing.supplies) || 0;
                            }

                            // 8. ПІДСУМКОВА СУМА
                            const finalTotal = basePrice + washCost + colorCost + oxidCost + suppliesCost;

                            return (
                                <div className="smart-calc-container" style={{
                                    marginTop: '20px', padding: '20px', borderRadius: '24px',
                                    background: 'rgba(212, 175, 55, 0.03)', border: '1px solid rgba(212, 175, 55, 0.15)'
                                }}>

                                    {/* Попередження, якщо ціну не знайдено навіть після глибокого пошуку */}
                                    {basePrice === 0 && allServices.length > 0 && (
                                        <div style={{ color: '#ff4d4d', fontSize: '10px', marginBottom: '12px', textAlign: 'center', fontWeight: 'bold' }}>
                                            ⚠️ Ціну для "{viewApp?.serviceName}" не знайдено. Перевірте назву в налаштуваннях послуг.
                                        </div>
                                    )}

                                    {/* Кнопка миття (для стрижок) */}
                                    {isHaircut && !isColoring && (
                                        <button
                                            onClick={() => setDyeingDetails({...dyeingDetails, extraWash: !dyeingDetails.extraWash})}
                                            style={{
                                                width: '100%', padding: '12px', marginBottom: '15px', borderRadius: '14px',
                                                background: needsWash ? '#D4AF37' : 'rgba(255,255,255,0.05)',
                                                color: needsWash ? '#000' : '#D4AF37', border: '1px solid #D4AF37',
                                                fontWeight: '800', fontSize: '11px', textTransform: 'uppercase', transition: '0.3s'
                                            }}
                                        >
                                            {needsWash ? '✓ Миття голови додано' : '+ Додати миття голови'}
                                        </button>
                                    )}

                                    {/* Блок фарбування */}
                                    {isColoring && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' }}>
                                                <select
                                                    value={dyeingDetails.hairLength}
                                                    onChange={e => setDyeingDetails({...dyeingDetails, hairLength: e.target.value, manualGrams: undefined})}
                                                    style={{ background: '#000', color: '#fff', border: '1px solid #222', padding: '12px 8px', borderRadius: '12px', fontSize: '12px' }}
                                                >
                                                    <option value="short">Коротке</option>
                                                    <option value="medium">Середнє</option>
                                                    <option value="long">Довге</option>
                                                </select>
                                                <select
                                                    value={dyeingDetails.density}
                                                    onChange={e => setDyeingDetails({...dyeingDetails, density: e.target.value, manualGrams: undefined})}
                                                    style={{ background: '#000', color: '#fff', border: '1px solid #222', padding: '12px 8px', borderRadius: '12px', fontSize: '12px' }}
                                                >
                                                    <option value="low">Рідке</option>
                                                    <option value="medium">Норма</option>
                                                    <option value="high">Густе</option>
                                                </select>
                                                <select
                                                    value={dyeingDetails.technique}
                                                    onChange={e => setDyeingDetails({...dyeingDetails, technique: e.target.value, manualGrams: undefined})}
                                                    style={{ background: '#000', color: '#fff', border: '1px solid #222', padding: '12px 8px', borderRadius: '12px', fontSize: '12px' }}
                                                >
                                                    <option value="one-tone">Тон</option>
                                                    <option value="balayage">Балаяж</option>
                                                    <option value="airtouch">Airtouch</option>
                                                </select>
                                            </div>

                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '800' }}>Фарба (г)</label>
                                                    <input
                                                        type="number" value={finalG}
                                                        onChange={e => setDyeingDetails({...dyeingDetails, manualGrams: e.target.value})}
                                                        style={{ background: '#000', border: '1px solid #222', padding: '12px', borderRadius: '12px', color: '#D4AF37', fontWeight: '700', width: '100%', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <label style={{ fontSize: '9px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', fontWeight: '800' }}>Окисник (г)</label>
                                                    <input
                                                        type="number" value={finalOx}
                                                        onChange={e => setDyeingDetails({...dyeingDetails, manualOxid: e.target.value})}
                                                        style={{ background: '#000', border: '1px solid #222', padding: '12px', borderRadius: '12px', color: '#D4AF37', fontWeight: '700', width: '100%', boxSizing: 'border-box' }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* ЧЕК */}
                                    <div style={{ background: '#D4AF37', borderRadius: '18px', color: '#000', padding: '20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', fontWeight: '700' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <span>{viewApp?.serviceName || 'Послуга'}:</span>
                                                <span>{basePrice} ₴</span>
                                            </div>
                                            {needsWash && (
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span>Миття голови:</span>
                                                    <span>+ {washCost} ₴</span>
                                                </div>
                                            )}
                                            {isColoring && (
                                                <>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>Матеріали:</span>
                                                        <span>+ {Math.round(colorCost + oxidCost)} ₴</span>
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                        <span>Технічний набір:</span>
                                                        <span>+ {suppliesCost} ₴</span>
                                                    </div>
                                                </>
                                            )}
                                            <div style={{ borderTop: '1px dashed rgba(0,0,0,0.15)', margin: '8px 0' }}></div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: '12px', fontWeight: '900', textTransform: 'uppercase' }}>Разом:</span>
                                                <span style={{ fontSize: '32px', fontWeight: '1000', letterSpacing: '-1.5px' }}>
                            {Math.round(finalTotal)} <small style={{fontSize: '16px'}}>₴</small>
                        </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}






                    </div>

                </div>
            )}
        </div>
    );
}