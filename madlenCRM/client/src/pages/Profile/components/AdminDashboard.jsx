import React, { useState, useEffect } from 'react';
import api from '../../../api/';
import './AdminDash.scss';

export const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalRevenue: 0, appointmentsCount: 0, activeStaff: 0 });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showMaterials, setShowMaterials] = useState(false);

    // ПОВНИЙ ОБ'ЄКТ PRICING З МАСИВОМ PAINTS
    const [pricing, setPricing] = useState({
        dye: 15,
        oxid: 5,
        supplies: 50,
        paints: [], // Тут будуть бренди фарб
        baseGrams: { short: 40, medium: 60, long: 80 },
        densityCoef: { low: 0.8, medium: 1, high: 1.3 },
        techniqueCoef: { "one-tone": 1, "balayage": 1.5, "airtouch": 2 }
    });

    const [showManager, setShowManager] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [catForm, setCatForm] = useState({ name: '', color: '#D4AF37', id: null });
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([fetchAdminData(), fetchPricing()]);
            setLoading(false);
        };
        loadData();
    }, []);

    const fetchAdminData = async () => {
        try {
            const [statRes, staffRes, catRes] = await Promise.all([
                api.get('/appointments/finance/stats').catch(() => ({ data: {} })),
                api.get('/staff').catch(() => ({ data: [] })),
                api.get('/categories').catch(() => ({ data: [] }))
            ]);
            setStats({
                totalRevenue: statRes.data.totalEarnings || 0,
                appointmentsCount: statRes.data.completedCount || 0,
                activeStaff: staffRes.data.length
            });
            setCategories(catRes.data);
        } catch (err) { console.error(err); }
    };

    const fetchPricing = async () => {
        try {
            const res = await api.get('/paint-settings');
            if (res.data && res.data.pricing) {
                // Гарантуємо, що paints завжди масив, навіть якщо в базі порожньо
                setPricing({
                    ...res.data.pricing,
                    paints: res.data.pricing.paints || []
                });
            }
        } catch (err) { console.error("Помилка завантаження прайсу:", err); }
    };

    const handleSavePricing = async () => {
        try {
            const response = await api.put('/paint-settings', pricing);
            setShowSuccess(true);
            if (response.data.pricing) setPricing(response.data.pricing);
        } catch (err) {
            console.error("Помилка збереження:", err);
            alert("Помилка при збереженні");
        }
    };

    // ФУНКЦІЇ ДЛЯ УПРАВЛІННЯ БРЕНДАМИ ФАРБ
    const addPaintBrand = () => {
        setPricing({
            ...pricing,
            paints: [...pricing.paints, { name: '', price: pricing.dye }]
        });
    };

    const updatePaintBrand = (index, field, value) => {
        const newPaints = [...pricing.paints];
        newPaints[index][field] = field === 'price' ? Number(value) : value;
        setPricing({ ...pricing, paints: newPaints });
    };

    const removePaintBrand = (index) => {
        const newPaints = pricing.paints.filter((_, i) => i !== index);
        setPricing({ ...pricing, paints: newPaints });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (catForm.id) {
                await api.put(`/categories/${catForm.id}`, { name: catForm.name, color: catForm.color });
            } else {
                const slug = catForm.name.toLowerCase().trim().replace(/\s+/g, '-');
                await api.post('/categories', { ...catForm, slug });
            }
            setShowEditModal(false);
            fetchAdminData();
        } catch (err) { alert("Помилка збереження"); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Видалити колекцію?")) return;
        try {
            await api.delete(`/categories/${id}`);
            fetchAdminData();
        } catch (err) { alert("Помилка видалення"); }
    };

    if (loading) return <div className="loader">Оновлення...</div>;

    return (
        <div className="admin-dash">
            {/* Статистика */}
            <div className="admin-dash__stats-grid">
                <div className="a-stat-card">
                    <span className="material-symbols-rounded icon-rev">payments</span>
                    <div className="a-stat-info">
                        <span className="label">Дохід</span>
                        <span className="value">{stats.totalRevenue.toLocaleString()} ₴</span>
                    </div>
                </div>
                <div className="a-stat-card">
                    <span className="material-symbols-rounded icon-app">event_available</span>
                    <div className="a-stat-info">
                        <span className="label">Записи</span>
                        <span className="value">{stats.appointmentsCount}</span>
                    </div>
                </div>
                <div className="a-stat-card">
                    <span className="material-symbols-rounded icon-staff">group</span>
                    <div className="a-stat-info">
                        <span className="label">Команда</span>
                        <span className="value">{stats.activeStaff}</span>
                    </div>
                </div>
            </div>

            <div className="admin-dash__controls">
                <h3>Керування системою</h3>

                <div className="admin-dash__section">
                    <button className={`materials-toggle ${showMaterials ? 'active' : ''}`} onClick={() => setShowMaterials(!showMaterials)}>
                        <div className="left">
                            <span className="material-symbols-rounded">payments</span>
                            <span>Налаштування вартості матеріалів</span>
                        </div>
                        <span className="material-symbols-rounded arrow">{showMaterials ? 'expand_less' : 'expand_more'}</span>
                    </button>

                    {showMaterials && (
                        <div className="materials-dropdown-panel">
                            {/* 1. БРЕНДИ ФАРБ ТА ЦІНИ */}
                            <div className="admin-config-section">
                                <h4 className="config-title">
                                    <span className="material-symbols-rounded">palette</span>
                                    Бренди фарб та ціни
                                </h4>

                                <div className="paint-brands-list">
                                    {pricing.paints.map((paint, index) => (
                                        <div key={index} className="paint-brand-row">
                                            <input
                                                className="brand-name-input"
                                                placeholder="Назва (напр. Matrix)"
                                                value={paint.name}
                                                onChange={(e) => updatePaintBrand(index, 'name', e.target.value)}
                                            />
                                            <div className="brand-price-group">
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    value={paint.price}
                                                    onChange={(e) => updatePaintBrand(index, 'price', e.target.value)}
                                                />
                                                <span className="unit">₴</span>
                                            </div>
                                            <button
                                                className="brand-del-btn"
                                                onClick={() => removePaintBrand(index)}
                                                title="Видалити бренд"
                                            >
                                                <span className="material-symbols-rounded">delete</span>
                                            </button>
                                        </div>
                                    ))}

                                    <button className="add-brand-btn" onClick={addPaintBrand}>
                                        <span className="material-symbols-rounded">add_circle</span>
                                        Додати новий бренд
                                    </button>
                                </div>
                            </div>

                            {/* 2. ДОДАТКОВІ ВИТРАТИ */}
                            <div className="admin-config-section">
                                <h4 className="config-title">
                                    <span className="material-symbols-rounded">payments</span>
                                    Додаткові витрати
                                </h4>
                                <div className="config-grid">
                                    <div className="config-item">
                                        <label>Окисник (1г)</label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                value={pricing.oxid}
                                                onChange={e => setPricing({...pricing, oxid: Number(e.target.value)})}
                                            />
                                            <span className="unit">₴</span>
                                        </div>
                                    </div>
                                    <div className="config-item">
                                        <label>Тех. набір (фікс)</label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                value={pricing.supplies}
                                                onChange={e => setPricing({...pricing, supplies: Number(e.target.value)})}
                                            />
                                            <span className="unit">₴</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. НОРМИ ВИТРАТ */}
                            <div className="admin-config-section" style={{ marginTop: '25px' }}>
                                <h4 className="config-title">
                                    <span className="material-symbols-rounded">straighten</span>
                                    Базова витрата (для авто-прогнозів)
                                </h4>
                                <div className="config-grid">
                                    <div className="config-item">
                                        <label>S (Коротке)</label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                value={pricing.baseGrams.short}
                                                onChange={e => setPricing({
                                                    ...pricing,
                                                    baseGrams: {...pricing.baseGrams, short: Number(e.target.value)}
                                                })}
                                            />
                                            <span className="unit">г</span>
                                        </div>
                                    </div>
                                    <div className="config-item">
                                        <label>M (Середнє)</label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                value={pricing.baseGrams.medium}
                                                onChange={e => setPricing({
                                                    ...pricing,
                                                    baseGrams: {...pricing.baseGrams, medium: Number(e.target.value)}
                                                })}
                                            />
                                            <span className="unit">г</span>
                                        </div>
                                    </div>
                                    <div className="config-item">
                                        <label>L (Довге)</label>
                                        <div className="input-group">
                                            <input
                                                type="number"
                                                value={pricing.baseGrams.long}
                                                onChange={e => setPricing({
                                                    ...pricing,
                                                    baseGrams: {...pricing.baseGrams, long: Number(e.target.value)}
                                                })}
                                            />
                                            <span className="unit">г</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* ПІДКАЗКА АЛГОРИТМУ */}
                            <div className="formula-preview" style={{ marginTop: '20px' }}>
                                <span className="material-symbols-rounded">auto_awesome</span>
                                <p>На основі цих даних система формує <b>динамічний прайс</b> для кожного фарбування індивідуально.</p>
                            </div>

                            <button className="save-materials-btn" onClick={handleSavePricing}>
                                Зберегти всі налаштування алгоритму
                            </button>
                        </div>
                    )}
                </div>

                <div className="controls-grid">
                    <button className="control-btn" onClick={() => window.location.href='/calendar'}>
                        <span className="material-symbols-rounded">calendar_month</span>
                        <span>Календар</span>
                    </button>
                    <button className="control-btn special-btn" onClick={() => setShowManager(true)}>
                        <span className="material-symbols-rounded">category</span>
                        <span>Колекції послуг</span>
                    </button>
                </div>
            </div>

            {/* Решта твоїх модалок (Manager, Edit, Success) */}
            {showManager && (
                <div className="modal-overlay" onClick={() => setShowManager(false)}>
                    <div className="modal-box manager-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-box__header">
                            <div className="title-with-icon">
                                <span className="material-symbols-rounded">settings_suggest</span>
                                <h3>Всі колекції</h3>
                            </div>
                            <button className="close-x" onClick={() => setShowManager(false)}>✕</button>
                        </div>
                        <div className="manager-content">
                            <button className="add-new-inline" onClick={() => { setCatForm({ name: '', color: '#D4AF37', id: null }); setShowEditModal(true); }}>
                                <span className="material-symbols-rounded">add</span> Додати нову категорію
                            </button>
                            <div className="cat-list-scroll">
                                {categories.map(cat => (
                                    <div key={cat._id} className="cat-manage-item">
                                        <div className="color-dot" style={{ backgroundColor: cat.color }}></div>
                                        <span className="name">{cat.name}</span>
                                        <div className="actions">
                                            <button onClick={() => { setCatForm({ name: cat.name, color: cat.color, id: cat._id }); setShowEditModal(true); }}>
                                                <span className="material-symbols-rounded">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(cat._id)} className="del-btn">
                                                <span className="material-symbols-rounded">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && (
                <div className="modal-overlay secondary" onClick={() => setShowEditModal(false)}>
                    <div className="modal-box admin-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-box__header">
                            <h3>{catForm.id ? 'Налаштування' : 'Нова колекція'}</h3>
                            <button className="close-x" onClick={() => setShowEditModal(false)}>✕</button>
                        </div>
                        <form className="modal-box__body modern-form" onSubmit={handleSubmit}>
                            <div className="calc-field">
                                <span>Назва</span>
                                <input type="text" className="calc-input" required value={catForm.name} onChange={e => setCatForm({...catForm, name: e.target.value})} />
                            </div>
                            <div className="color-picker-row">
                                <label>Колір в системі</label>
                                <input type="color" value={catForm.color} onChange={e => setCatForm({...catForm, color: e.target.value})} />
                            </div>
                            <button type="submit" className="wh-save-btn">
                                <span className="material-symbols-rounded">done_all</span>
                                {catForm.id ? 'Зберегти зміни' : 'Створити'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showSuccess && (
                <div className="modal-overlay" onClick={() => setShowSuccess(false)}>
                    <div className="modal-box admin-modal success-modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-box__header">
                            <button className="close-x" onClick={() => setShowSuccess(false)}>✕</button>
                            <div className="title-with-icon">
                                <span className="material-symbols-rounded">check_circle</span>
                                <h3>Успішно оновлено</h3>
                            </div>
                        </div>
                        <div className="modal-box__body">
                            <p>Дані успішно збережено та синхронізовано з календарем.</p>
                            <button className="wh-save-btn" onClick={() => setShowSuccess(false)}>Зрозуміло</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};