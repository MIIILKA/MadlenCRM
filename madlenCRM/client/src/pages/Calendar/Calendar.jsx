import React, { useState, useEffect, useRef } from 'react';
import api from '../../api/';
import './Calendar.scss';

export default function Calendar() {
    const [staff, setStaff] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
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
        components: [{ name: 'Фарба 1', grams: '' }],
        extraWash: false,
        selectedPaintId: '',
        selectedPaintPrice: 0
    });

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
            setLoading(true); // Вмикаємо прелоадер з вашим логотипом

            // Чекаємо ВСІ запити одночасно
            const [staffRes, appsRes, catRes, servicesRes] = await Promise.all([
                api.get('/staff'),

                api.get('/appointments/all').catch(() => ({ data: [] })), // Поверне порожній масив замість помилки 500
                api.get('/categories').catch(() => ({ data: [] })),
                api.get('/services')
            ]);

            setStaff(staffRes.data);
            setAppointments(appsRes.data);
            setCategories(catRes.data);
            setServices(servicesRes.data);

            console.log("🚀 Madlen CRM: Дані синхронізовано");
        } catch (err) {
            console.error("Помилка завантаження:", err);
            alert("Помилка зв'язку з сервером");
        } finally {
            // Плавне зникнення логотипа через 500мс
            setTimeout(() => setLoading(false), 500);
        }
    };


    const handleSaveDyeing = async (appId, currentTotal, g, ox) => {
        try {
            const dataToSave = {
                dyeingDetails: {
                    ...dyeingDetails,
                    finalPrice: currentTotal,
                    grams: g,
                    oxid: ox
                }
            };
            await api.patch(`/appointments/${appId}`, dataToSave);

            // Оновлюємо стейт, щоб кнопка зникла після збереження
            setAppointments(prev => prev.map(a =>
                a._id === appId ? { ...a, dyeingDetails: dataToSave.dyeingDetails } : a
            ));

            // Оновлюємо модалку, щоб дані там теж були свіжі
            setViewApp(prev => ({ ...prev, dyeingDetails: dataToSave.dyeingDetails }));

            alert('Дані збережено!');
        } catch (err) {
            console.error("Save error:", err);
            alert('Помилка збереження');
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
            const durationValue = Number(newApp.duration) || (selectedService ? Number(selectedService.duration) : 20);


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
        const d = new Date(); // Створюємо свіжий об'єкт для кожного дня
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

        // 1. ПЕРЕВІРКА: Чи це технічна перерва?
        const isInternal = app.serviceName === "ТЕХНІЧНА ПЕРЕРВА" || app.isInternal || !app.serviceId;

        // 2. Визначаємо тривалість для візуалізації
        const sId = (app.serviceId || app.service?._id || app.service || "").toString();
        const duration = Number(app.duration) ||
            Number(master?.specializations?.[sId]) || 20;

        // 3. Розрахунок позиції та висоти
        const [h, m] = app.time.split(':').map(Number);
        const startFromDayStart = (h - START_HOUR) * 60 + m;
        const top = (startFromDayStart / 20) * CELL_HEIGHT;
        const height = (duration / 20) * CELL_HEIGHT;

        // 4. Логіка зміщення (Overlap)
        const sameTimeApps = allMasterApps
            .filter(a => a.time === app.time && a._id !== app._id)
            .sort((a, b) => a._id.localeCompare(b._id));

        const appIndex = sameTimeApps.findIndex(a => a._id === app._id);
        const isOverlapping = sameTimeApps.length > 0;

        const width = isOverlapping ? `${95 / (sameTimeApps.length + 1)}%` : '95%';
        const left = isOverlapping ? `${(95 / (sameTimeApps.length + 1)) * (appIndex + 1)}%` : '2%';

        // 5. КОЛЬОРИ
        // Якщо перерва — темно-сірий, якщо запис — колір категорії
        const baseColor = isInternal ? '#555555' : (app.categoryColor || '#D4AF37');

        return {
            position: 'absolute',
            top: `${top}px`,
            height: `${height - 2}px`,
            left,
            width,
            zIndex: isOverlapping ? 10 + appIndex : 5,
            backgroundColor: `${baseColor}25`, // 25 — це прозорість фону
            borderLeft: `4px solid ${baseColor}`, // Яскрава лінія збоку
            color: isInternal ? '#aaa' : 'inherit',
            transition: 'all 0.2s ease-in-out'
        };
    };



    const handleDrop = async (e, targetStaffId, targetTime) => {
        e.preventDefault();

        // 1. Отримуємо ID (завжди перетворюємо на рядок)
        const id = (e.dataTransfer.getData("appId") || e.dataTransfer.getData("text/plain")).toString();
        if (!id || id === "undefined") return;

        const draggingApp = appointments.find(a => a._id === id);
        if (!draggingApp) return;

        // 2. Гарантуємо, що targetStaffId — це тільки рядок ID
        const staffIdString = (targetStaffId?._id || targetStaffId).toString();

        // 3. Форматуємо дату (YYYY-MM-DD)
        let finalDateToSend = selectedDate;
        if (selectedDate instanceof Date) {
            finalDateToSend = selectedDate.toISOString().split('T')[0];
        } else if (typeof selectedDate === 'string') {
            finalDateToSend = selectedDate.split('T')[0];
        }

        // 4. Оптимістичне оновлення (щоб інтерфейс не "тупив")
        setAppointments(prev => prev.map(a =>
            a._id === id ? { ...a, staff: staffIdString, time: targetTime, date: finalDateToSend } : a
        ));

        // 5. Відправка на сервер
        try {
            await api.patch(`/appointments/${id}`, {
                staff: staffIdString,
                time: targetTime,
                date: finalDateToSend,
                duration: Number(draggingApp.duration) || 20
            });

            console.log("✅ Madlen CRM: Запис успішно перенесено");
            fetchData();
        } catch (err) {
            const errorMsg = err.response?.data?.message || "";

            if (errorMsg.includes("Накладка")) {
                // Юзер-френдлі лог для адміністратора
                alert("⚠️ Увага: Накладка можлива тільки на фарбування! \nНе можна ставити дві стрижки на один час або записувати клієнтів 'хвилина в хвилину'.");
                console.warn("Madlen Log: Блокування накладки (несумісні послуги)");
            } else {
                alert("❌ Не вдалося оновити запис. Можливо, час уже зайнятий.");
                console.error("Madlen Log: Critical update error", err.response?.data);
            }

            fetchData(); // Обов'язково відкочуємо UI до стану бази
        }
    };




    if (loading) return <div className="dash-loader">Madlen CRM...</div>;

    return (
        <div className="altegio-clean">
            <header className="cal-header">
                <div className="left">
                    <div className="week-btns">
                        {weekDays.map(d => {
                            const iso = d.toLocaleDateString('en-CA');
                            const isToday = iso === new Date().toLocaleDateString('en-CA');
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
                    {timeLabels.map(t => {
                        const [y, mon, d] = selectedDate.split('-').map(Number);
                        const [h, m_val] = t.split(':').map(Number);
                        const isPast = new Date(y, mon - 1, d, h, m_val) < new Date();

                        return (
                            <div key={t} className={`t-slot ${isPast ? 'is-past' : ''} ${t.endsWith(':00') ? 'hour' : 'min'}`}>
                                {t.endsWith(':00') ? <b>{t.split(':')[0]}<sup>00</sup></b> : <i>{t.split(':')[1]}</i>}
                            </div>
                        );
                    })}
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
                                            // 1. Отримуємо поточний момент
                                            const now = new Date();

                                            // 2. Створюємо об'єкт дати для обраного слоту
                                            // selectedDate у вас має формат "YYYY-MM-DD", time — "HH:mm"
                                            const [year, month, day] = selectedDate.split('-').map(Number);
                                            const [hours, minutes] = time.split(':').map(Number);
                                            const slotDate = new Date(year, month - 1, day, hours, minutes);

                                            // 3. Якщо час у минулому — нічого не робимо (або виводимо alert)
                                            if (slotDate < now) {
                                                alert("Неможливо створити запис на час, що вже минув.");
                                                return;
                                            }

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
                                    let targetDateStr = typeof selectedDate === 'string'
                                        ? selectedDate.split('T')[0]
                                        : selectedDate.toISOString().split('T')[0];

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

                                        // Перевірка, чи це саме той запис, який ми зараз клацаємо/редагуємо
                                        const isCurrentEditing = viewApp?._id === app._id;
                                        const isDirty = isCurrentEditing && JSON.stringify(dyeingDetails) !== JSON.stringify(app.dyeingDetails || {
                                            formula: '', hairLength: 'medium', density: 'medium', technique: 'one-tone', extraWash: false
                                        });

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
                                                    if (isDyeing && app.dyeingDetails) {
                                                        setDyeingDetails({
                                                            ...app.dyeingDetails,
                                                            components: app.dyeingDetails.components?.length > 0
                                                                ? app.dyeingDetails.components
                                                                : [{ name: 'Фарба 1', grams: '' }]
                                                        });
                                                    } else {
                                                        setDyeingDetails({
                                                            formula: '',
                                                            components: [{ name: 'Фарба 1', grams: '' }],
                                                            extraWash: false,
                                                            selectedPaintId: '',
                                                            selectedPaintPrice: 0
                                                        });
                                                    }
                                                    setViewApp({ ...app, masterName: m.name });
                                                }}
                                            >
                                                <div className="app-time-tag" style={{ color: app.categoryColor || '#D4AF37' }}>
                                                    {app.time}
                                                </div>
                                                <div className="app-client-name">{app.clientName}</div>
                                                <div className="app-service-name">{app.serviceName}</div>

                                                {/* Іконка палітри */}
                                                {isDyeing && <span className="dye-icon material-symbols-rounded">palette</span>}

                                                {/* КНОПКА ЗБЕРЕГТИ ПРЯМО В КАРТЦІ (якщо є зміни) */}

                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{newApp.clientName === "ТЕХНІЧНА ПЕРЕРВА" ? "☕ Блокування часу" : "Швидкий запис"}</h3>
                            <span className="time-badge">{newApp.time}</span>
                        </div>

                        <div className="modal-body-content" style={{ padding: '20px' }}>
                            {newApp.clientName === "ТЕХНІЧНА ПЕРЕРВА" ? (
                                /* РЕЖИМ ПЕРЕРВИ: Тільки велике число */
                                <div className="pause-setup" style={{ textAlign: 'center', padding: '10px 0' }}>
                                    <label style={{ display: 'block', fontSize: '11px', color: '#D4AF37', fontWeight: '900', textTransform: 'uppercase', marginBottom: '15px' }}>
                                        Тривалість (хвилини):
                                    </label>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                        <input
                                            type="number"
                                            value={newApp.duration || 60}
                                            onChange={e => setNewApp({...newApp, duration: Number(e.target.value)})}
                                            autoFocus
                                            style={{
                                                background: 'transparent', border: 'none', borderBottom: '3px solid #D4AF37',
                                                fontSize: '64px', color: '#fff', width: '150px', textAlign: 'center', fontWeight: '900', outline: 'none'
                                            }}
                                        />
                                        <span style={{ fontSize: '24px', color: '#D4AF37', fontWeight: 'bold' }}>хв</span>
                                    </div>
                                </div>
                            ) : (
                                /* РЕЖИМ ЗАПИСУ: Стандартна сітка */
                                <div className="form-grid">
                                    <input type="text" placeholder="Ім'я клієнта" value={newApp.clientName} onChange={e => setNewApp({...newApp, clientName: e.target.value})} />
                                    <input type="tel" placeholder="Телефон" value={newApp.phone} onChange={handlePhoneChange} />
                                    <select value={newApp.service} onChange={e => setNewApp({...newApp, service: e.target.value})}>
                                        <option value="">Оберіть послугу</option>
                                        {services.map(s => <option key={s._id} value={s._id}>{s.name} — {s.price}₴</option>)}
                                    </select>
                                    <textarea placeholder="Коментар..." value={newApp.comment} onChange={e => setNewApp({...newApp, comment: e.target.value})} rows="2" />
                                </div>
                            )}
                        </div>

                        <div style={{ padding: '0 20px 20px' }}>
                            <button
                                type="button"
                                style={{
                                    width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #D4AF37',
                                    background: newApp.clientName === "ТЕХНІЧНА ПЕРЕРВА" ? 'rgba(212,175,55,0.1)' : 'transparent',
                                    color: '#D4AF37', fontWeight: '800', fontSize: '11px', cursor: 'pointer', transition: '0.3s'
                                }}
                                onClick={() => {
                                    if (newApp.clientName === "ТЕХНІЧНА ПЕРЕРВА") {
                                        setNewApp({ staff: newApp.staff, time: newApp.time, clientName: '', phone: '+380', service: '', comment: '', duration: 20 });
                                    } else {
                                        const tech = services.find(s => s.isInternal || s.name.toLowerCase().includes('перерв'));
                                        setNewApp({
                                            ...newApp,
                                            service: tech?._id || '', // ВАЖЛИВО: очищуємо або ставимо тех. послугу
                                            clientName: "ТЕХНІЧНА ПЕРЕРВА",
                                            phone: "+380000000000",
                                            duration: 60,
                                            comment: "Технічна пауза"
                                        });
                                    }
                                }}
                            >
                                {newApp.clientName === "ТЕХНІЧНА ПЕРЕРВА" ? "✕ ПОВЕРНУТИСЬ ДО ЗАПИСУ" : "☕ РЕЖИМ ПЕРЕРВИ"}
                            </button>
                        </div>

                        <div className="modal-btns">
                            <button className="save-btn" onClick={handleCreateApp}>Записати</button>
                            <button className="close-btn" onClick={() => setIsModalOpen(false)}>Скасувати</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Модалка перегляду запису */}
            {/* Модалка перегляду запису */}
            {viewApp && (
                <div className="modal-overlay" onClick={() => setViewApp(null)}>
                    <div className="view-modal" onClick={e => e.stopPropagation()}>
                        <button className="view-close" onClick={() => setViewApp(null)}>✕</button>
                        <div className="view-modal-content">
                            {viewApp.clientName === "ТЕХНІЧНА ПЕРЕРВА" ? (
                                <div className="pause-view-content" style={{ padding: '30px 10px', textAlign: 'center' }}>
                                    <div style={{
                                        width: '80px', height: '80px', background: 'rgba(212, 175, 55, 0.1)',
                                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                                        justifyContent: 'center', margin: '0 auto 20px'
                                    }}>
                                        <span style={{ fontSize: '40px' }}>☕</span>
                                    </div>
                                    <h2 style={{ color: '#D4AF37', fontSize: '22px', fontWeight: '900', letterSpacing: '1px', marginBottom: '10px' }}>
                                        ТЕХНІЧНА ПЕРЕРВА
                                    </h2>
                                    <div style={{ display: 'inline-flex', gap: '15px', marginBottom: '25px' }}>
                                        <div style={{ textAlign: 'left' }}>
                                            <span style={{ display: 'block', fontSize: '10px', color: '#666', fontWeight: 'bold' }}>ЧАС</span>
                                            <span style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>{viewApp.time}</span>
                                        </div>
                                        <div style={{ width: '1px', background: '#333' }}></div>
                                        <div style={{ textAlign: 'left' }}>
                                            <span style={{ display: 'block', fontSize: '10px', color: '#666', fontWeight: 'bold' }}>ТРИВАЛІСТЬ</span>
                                            <span style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>{viewApp.duration} хв</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={async () => {
                                            if (!window.confirm('Видалити це блокування часу?')) return;
                                            try {
                                                await api.patch(`/appointments/${viewApp._id}`, { status: 'cancelled' });
                                                setViewApp(null);
                                                fetchData();
                                            } catch (err) {
                                                alert('Помилка при видаленні');
                                            }
                                        }}
                                        style={{
                                            width: '100%', padding: '16px', borderRadius: '14px',
                                            background: 'transparent', border: '1px solid #ff4d4d',
                                            color: '#ff4d4d', fontWeight: '800', fontSize: '12px',
                                            textTransform: 'uppercase', cursor: 'pointer', transition: '0.3s'
                                        }}
                                        onMouseEnter={e => e.target.style.background = 'rgba(255,77,77,0.1)'}
                                        onMouseLeave={e => e.target.style.background = 'transparent'}
                                    >
                                        ✕ Видалити перерву
                                    </button>
                                </div>
                            ) : (
                                <>
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
                                            <span className="vd-value">{viewApp.categoryName || '—'}</span>
                                        </div>
                                        <div className="view-detail-row">
                                            <span className="vd-label">Послуга</span>
                                            <span className="vd-value">{viewApp.serviceName || '—'}</span>
                                        </div>
                                        {viewApp.comment && (
                                            <div className="view-detail-row">
                                                <span className="vd-label">Коментар</span>
                                                <span className="vd-value comment">{viewApp.comment}</span>
                                            </div>
                                        )}
                                    </div>
                                {/* Блок побажань клієнта у Calendar.jsx */}
                                    {viewApp.clientWishes && viewApp.clientWishes.trim() !== "" && (
                                        <div className="client-wish-box" style={{
                                            background: 'rgba(212, 175, 55, 0.1)',
                                            borderLeft: '4px solid #D4AF37',
                                            padding: '12px 15px',
                                            borderRadius: '4px 12px 12px 4px',
                                            margin: '10px 20px 20px',
                                            boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                                <span className="material-symbols-rounded" style={{ color: '#D4AF37', fontSize: '18px' }}>magic_button</span>
                                                <span style={{ fontSize: '11px', fontWeight: '900', textTransform: 'uppercase', color: '#D4AF37', letterSpacing: '0.5px' }}>
                Побажання клієнта
            </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#fff', fontStyle: 'italic', lineHeight: '1.5', opacity: 0.9 }}>
                                                «{viewApp.clientWishes}»
                                            </p>
                                        </div>
                                    )}
                                    {(() => {
                                        const normalizedSearchName = viewApp?.serviceName?.trim()?.toLowerCase();
                                        const currentService = services.find(s =>
                                            (s?._id && (s._id === viewApp?.serviceId || s._id === viewApp?.service?._id)) ||
                                            (s?.name?.trim()?.toLowerCase() === normalizedSearchName)
                                        );
                                        const isColoring = /фарб|color|малюв|dye/i.test(viewApp?.serviceName || "");
                                        if (!isColoring) return null;
                                        // Хелпер для перерахунку грамів при зміні селекторів
                                        const calcAutoGrams = (hairLength, density, technique) => {
                                            const baseG = Number(pricing?.baseGrams?.[hairLength]) || 0;
                                            const densC = Number(pricing?.densityCoef?.[density]) || 1;
                                            const techC = Number(pricing?.techniqueCoef?.[technique]) || 1;
                                            return Math.round((baseG * densC * techC) / 10) * 10;
                                        };

                                        return (
                                            <div className="smart-calc-container">
                                                <label className="calc-section-label">🧪 Рецепт фарбування</label>

                                                {/* БЛОК 1: ФІЛЬТРИ — з автоперерахунком грамів */}
                                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '15px' }}>
                                                    <select
                                                        value={dyeingDetails.hairLength || 'medium'}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const auto = calcAutoGrams(val, dyeingDetails.density, dyeingDetails.technique);
                                                            setDyeingDetails({
                                                                ...dyeingDetails,
                                                                hairLength: val,
                                                                components: [{ ...dyeingDetails.components[0], grams: String(auto) }]
                                                            });
                                                        }}
                                                        className="component-name-input" style={{ fontSize: '11px', padding: '8px' }}
                                                    >
                                                        <option value="short">S (Коротке)</option>
                                                        <option value="medium">M (Середнє)</option>
                                                        <option value="long">L (Довге)</option>
                                                    </select>
                                                    <select
                                                        value={dyeingDetails.density || 'medium'}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const auto = calcAutoGrams(dyeingDetails.hairLength, val, dyeingDetails.technique);
                                                            setDyeingDetails({
                                                                ...dyeingDetails,
                                                                density: val,
                                                                components: [{ ...dyeingDetails.components[0], grams: String(auto) }]
                                                            });
                                                        }}
                                                        className="component-name-input" style={{ fontSize: '11px', padding: '8px' }}
                                                    >
                                                        <option value="low">Рідке</option>
                                                        <option value="medium">Норма</option>
                                                        <option value="high">Густе</option>
                                                    </select>
                                                    <select
                                                        value={dyeingDetails.technique || 'one-tone'}
                                                        onChange={e => {
                                                            const val = e.target.value;
                                                            const auto = calcAutoGrams(dyeingDetails.hairLength, dyeingDetails.density, val);
                                                            setDyeingDetails({
                                                                ...dyeingDetails,
                                                                technique: val,
                                                                components: [{ ...dyeingDetails.components[0], grams: String(auto) }]
                                                            });
                                                        }}
                                                        className="component-name-input" style={{ fontSize: '11px', padding: '8px' }}
                                                    >
                                                        <option value="one-tone">Тон</option>
                                                        <option value="balayage">Балаяж</option>
                                                        <option value="airtouch">Airtouch</option>
                                                    </select>
                                                </div>

                                                {/* БЛОК 2: ФАРБИ */}
                                                {dyeingDetails.components.map((comp, idx) => (
                                                    <div key={idx} className="mixing-component-row">
                                                        <select
                                                            className="component-name-input"
                                                            value={comp.name}
                                                            onChange={(e) => {
                                                                const selectedName = e.target.value;
                                                                const paintInfo = pricing.paints?.find(p => p.name === selectedName);
                                                                const newComps = [...dyeingDetails.components];
                                                                newComps[idx] = {
                                                                    ...newComps[idx],
                                                                    name: selectedName,
                                                                    pricePerGram: paintInfo ? paintInfo.price : (pricing.dye || 15)
                                                                };
                                                                setDyeingDetails({ ...dyeingDetails, components: newComps });
                                                            }}
                                                        >
                                                            <option value="">Оберіть фарбу...</option>
                                                            {pricing.paints?.map((p, pIdx) => (
                                                                <option key={pIdx} value={p.name}>{p.name} ({p.price} ₴/г)</option>
                                                            ))}
                                                        </select>
                                                        <input
                                                            type="number"
                                                            className="component-grams-input"
                                                            placeholder="0"
                                                            value={comp.grams}
                                                            onChange={(e) => {
                                                                const newComps = [...dyeingDetails.components];
                                                                newComps[idx] = { ...newComps[idx], grams: e.target.value };
                                                                setDyeingDetails({ ...dyeingDetails, components: newComps });
                                                            }}
                                                        />
                                                        {dyeingDetails.components.length > 1 && (
                                                            <button className="remove-component-btn" onClick={() =>
                                                                setDyeingDetails({ ...dyeingDetails, components: dyeingDetails.components.filter((_, i) => i !== idx) })
                                                            }>✕</button>
                                                        )}
                                                    </div>
                                                ))}

                                                <button className="add-component-action-btn" onClick={() =>
                                                    setDyeingDetails({ ...dyeingDetails, components: [...dyeingDetails.components, { name: '', grams: '', pricePerGram: 0 }] })
                                                }>
                                                    + Додати фарбу
                                                </button>

                                                {/* БЛОК 3: ОКИСНИК */}
                                                <div className="mixing-component-row" style={{ marginTop: '10px', borderTop: '1px solid #222', paddingTop: '10px' }}>
                                                    <div className="component-name-input" style={{ flex: 1.5, display: 'flex', alignItems: 'center', opacity: 0.8 }}>
                                                        🧪 Окисник ({pricing.oxid || 5} ₴/г)
                                                    </div>
                                                    <input
                                                        type="number"
                                                        className="component-grams-input"
                                                        placeholder="Окс."
                                                        value={dyeingDetails.oxidGrams || ''}
                                                        onChange={(e) => setDyeingDetails({ ...dyeingDetails, oxidGrams: e.target.value })}
                                                    />
                                                    <div style={{ width: '32px' }}></div>
                                                </div>

                                                {/* РОЗРАХУНОК */}
                                                {(() => {
                                                    const svc = services.find(s =>
                                                        s._id === viewApp?.service?._id ||
                                                        s._id === viewApp?.service ||
                                                        s.name === viewApp?.serviceName
                                                    );
                                                    const basePriceToUse = Number(viewApp?.price) || Number(svc?.price) || 0;

                                                    const densCoef = Number(pricing.densityCoef?.[dyeingDetails.density || 'medium']) || 1;
                                                    const techCoef = Number(pricing.techniqueCoef?.[dyeingDetails.technique || 'one-tone']) || 1;
                                                    const calculatedServicePrice = basePriceToUse * densCoef * techCoef;

                                                    const washSvc = services.find(s => s?.name?.toLowerCase().includes('миття'));
                                                    const washCost = Number(washSvc?.price) || 50;

                                                    const paintCost = dyeingDetails.components.reduce((acc, curr) =>
                                                        acc + (Number(curr.grams) || 0) * (Number(curr.pricePerGram) || pricing.dye || 15), 0);
                                                    const oxidCost = (Number(dyeingDetails.oxidGrams) || 0) * (Number(pricing.oxid) || 5);
                                                    const totalMaterialsCost = paintCost + oxidCost;
                                                    const suppliesCost = Number(pricing.supplies) || 0;
                                                    const totalGrams = dyeingDetails.components.reduce((acc, curr) => acc + (Number(curr.grams) || 0), 0) + (Number(dyeingDetails.oxidGrams) || 0);
                                                    const finalTotal = calculatedServicePrice + washCost + totalMaterialsCost + suppliesCost;

                                                    return (
                                                        <>
                                                            <div className="calc-summary-card">
                                                                <div className="summary-details-list">
                                                                    <div className="summary-row">
                                                                        <span>Послуга (з коеф.):</span>
                                                                        <span>{Math.round(calculatedServicePrice)} ₴</span>
                                                                    </div>
                                                                    <div className="summary-row">
                                                                        <span>Миття (авто):</span>
                                                                        <span>+ {washCost} ₴</span>
                                                                    </div>
                                                                    <div className="summary-row">
                                                                        <span>Матеріали ({totalGrams}г):</span>
                                                                        <span>+ {Math.round(totalMaterialsCost)} ₴</span>
                                                                    </div>
                                                                    <div className="summary-row">
                                                                        <span>Тех. набір:</span>
                                                                        <span>+ {suppliesCost} ₴</span>
                                                                    </div>
                                                                    <div className="summary-divider"></div>
                                                                    <div className="summary-total-row">
                                                                        <span className="total-label">РАЗОМ:</span>
                                                                        <span className="total-value">{Math.round(finalTotal)} ₴</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button className="save-dyeing-data-btn" onClick={() => handleSaveDyeing(viewApp._id, finalTotal, totalGrams, dyeingDetails.oxidGrams)}>
                                                                💾 ЗБЕРЕГТИ КАРТКУ КЛІЄНТА
                                                            </button>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        );
                                    })()}

                                {viewApp.status !== 'cancelled' && (
                                    <button onClick={async () => {
                                        if (!window.confirm('Скасувати цей запис?')) return;
                                        await api.patch(`/appointments/${viewApp._id}`, { status: 'cancelled' });
                                        setViewApp(null);
                                        fetchData();
                                    }} style={{ width: '100%', marginTop: '12px', color: '#ff4d4d', background: 'transparent', border: 'none', fontSize: '11px', cursor: 'pointer', fontWeight: '800' }}>
                                        ✕ СКАСУВАТИ ЗАПИС
                                    </button>
                                )}
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}