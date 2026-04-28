import React, { useState, useEffect } from 'react';
import api from '../../../api/';
import './AdminDash.scss';

export const AdminDashboard = () => {
    const [stats, setStats] = useState({ totalRevenue: 0, appointmentsCount: 0, activeStaff: 0 });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [dyePrice, setDyePrice] = useState(15); // Тимчасове значення за
    const [showMaterials, setShowMaterials] = useState(false);
    const [pricing, setPricing] = useState({
        dye: 15,
        oxid: 5,
        supplies: 50,
        // Нові динамічні дані:
        baseGrams: { short: 40, medium: 60, long: 80 },
        densityCoef: { low: 0.8, medium: 1, high: 1.3 },
        techniqueCoef: { "one-tone": 1, "balayage": 1.5, "airtouch": 2 }
    });    // Модалки
    const [showManager, setShowManager] = useState(false); // Вікно зі списком
    const [showEditModal, setShowEditModal] = useState(false); // Вікно створення/редагування
    const [catForm, setCatForm] = useState({ name: '', color: '#D4AF37', id: null });
    const [showSuccess, setShowSuccess] = useState(false);




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
        finally { setLoading(false); }
    };

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            await Promise.all([
                fetchAdminData(),
                fetchPricing()
            ]);
            setLoading(false);
        };
        loadData();
    }, []); // Викличеться один раз при старті


    const handleOpenCreate = () => {
        setCatForm({ name: '', color: '#D4AF37', id: null });
        setShowEditModal(true);
    };

    const handleOpenEdit = (cat) => {
        setCatForm({ name: cat.name, color: cat.color, id: cat._id });
        setShowEditModal(true);
    };


    const fetchPricing = async () => {
        try {
            const res = await api.get('/paint-settings');
            if (res.data && res.data.pricing) {
                // Зберігаємо ПОВНИЙ об'єкт pricing зі всіма вкладеними полями
                setPricing(res.data.pricing);
            }
        } catch (err) {
            console.error("Помилка завантаження прайсу:", err);
        }
    };
    const handleSavePricing = async () => {
        try {
            // Відправляємо весь об'єкт pricing
            const response = await api.put('/paint-settings', pricing);

            setShowSuccess(true);
            if (response.data.pricing) {
                setPricing(response.data.pricing);
            }
        } catch (err) {
            console.error("Помилка збереження:", err);
            alert("Помилка при збереженні налаштувань");
        }
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

            {/* Керування */}
            <div className="admin-dash__controls">
                <h3>Керування системою</h3>


                <div className="admin-dash__section">
                    <button
                        className={`materials-toggle ${showMaterials ? 'active' : ''}`}
                        onClick={() => setShowMaterials(!showMaterials)}
                    >
                        <div className="left">
                            <span className="material-symbols-rounded">payments</span>
                            <span>Налаштування вартості матеріалів</span>
                        </div>
                        <span className="material-symbols-rounded arrow">{showMaterials ? 'expand_less' : 'expand_more'}</span>
                    </button>

                    {showMaterials && (
                        <div className="materials-dropdown-panel">
                            {/* Секція 1: Базові ціни */}
                            <div className="admin-config-section">
                                <h4 className="config-title">💰 Вартість сировини та витрат</h4>
                                <div className="config-grid">
                                    <div className="config-item">
                                        <label>Фарба (1г)</label>
                                        <div className="input-group">
                                            <input type="number" value={pricing.dye} onChange={e => setPricing({...pricing, dye: Number(e.target.value)})} />
                                            <span className="unit">₴</span>
                                        </div>
                                    </div>
                                    <div className="config-item">
                                        <label>Окисник (1г)</label>
                                        <div className="input-group">
                                            <input type="number" value={pricing.oxid} onChange={e => setPricing({...pricing, oxid: Number(e.target.value)})} />
                                            <span className="unit">₴</span>
                                        </div>
                                    </div>
                                    <div className="config-item">
                                        <label>Тех. набір (фікс)</label>
                                        <div className="input-group">
                                            <input type="number" value={pricing.supplies} onChange={e => setPricing({...pricing, supplies: Number(e.target.value)})} />
                                            <span className="unit">₴</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Секція 2: Норми витрат фарби */}
                            <div className="admin-config-section" style={{marginTop: '25px'}}>
                                <h4 className="config-title">📏 Базова витрата фарби (г)</h4>
                                <div className="config-grid">
                                    <div className="config-item">
                                        <label>Коротке (S)</label>
                                        <input
                                            type="number"
                                            value={pricing?.baseGrams?.short ?? 0}
                                            onChange={e => setPricing({
                                                ...pricing,
                                                baseGrams: { ...(pricing?.baseGrams || {}), short: Number(e.target.value) }
                                            })}
                                        />
                                    </div>

                                    <div className="config-item">
                                        <label>Середнє (M)</label>
                                        <input
                                            type="number"
                                            value={pricing?.baseGrams?.medium ?? 0}
                                            onChange={e => setPricing({
                                                ...pricing,
                                                baseGrams: { ...(pricing?.baseGrams || {}), medium: Number(e.target.value) }
                                            })}
                                        />
                                    </div>

                                    <div className="config-item">
                                        <label>Довге (L)</label>
                                        <input
                                            type="number"
                                            value={pricing?.baseGrams?.long ?? 0}
                                            onChange={e => setPricing({
                                                ...pricing,
                                                baseGrams: { ...(pricing?.baseGrams || {}), long: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>



                            {/* Секція 3: Складність технік */}
                            <div className="admin-config-section" style={{marginTop: '25px'}}>
                                <h4 className="config-title">🚀 Множники технік (коефіцієнт)</h4>
                                <div className="config-grid">
                                    <div className="config-item">
                                        <label>В один тон</label>
                                        <input type="number" step="0.1" value={pricing.techniqueCoef["one-tone"]}
                                               onChange={e => setPricing({...pricing, techniqueCoef: {...pricing.techniqueCoef, "one-tone": Number(e.target.value)}})} />
                                    </div>
                                    <div className="config-item">
                                        <label>Балаяж</label>
                                        <input type="number" step="0.1" value={pricing.techniqueCoef.balayage}
                                               onChange={e => setPricing({...pricing, techniqueCoef: {...pricing.techniqueCoef, balayage: Number(e.target.value)}})} />
                                    </div>
                                    <div className="config-item">
                                        <label>Airtouch</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={pricing?.techniqueCoef?.airtouch ?? 0}
                                            onChange={e => setPricing({
                                                ...pricing,
                                                techniqueCoef: { ...(pricing?.techniqueCoef || {}), airtouch: Number(e.target.value) }
                                            })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="formula-preview" style={{marginTop: '25px'}}>
                                <span className="material-symbols-rounded">auto_awesome</span>
                                <p>Система автоматично розрахує вагу суміші та фінальний чек на основі цих значень.</p>
                            </div>

                            <button className="save-materials-btn" onClick={handleSavePricing}>
                                Зберегти налаштування алгоритму
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

            {/* 1. Модалка-менеджер (Список) */}
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
                            <button className="add-new-inline" onClick={handleOpenCreate}>
                                <span className="material-symbols-rounded">add</span> Додати нову категорію
                            </button>

                            <div className="cat-list-scroll">
                                {categories.map(cat => (
                                    <div key={cat._id} className="cat-manage-item">
                                        <div className="color-dot" style={{ backgroundColor: cat.color }}></div>
                                        <span className="name">{cat.name}</span>
                                        <div className="actions">
                                            <button onClick={() => handleOpenEdit(cat)} title="Редагувати">
                                                <span className="material-symbols-rounded">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete(cat._id)} title="Видалити" className="del-btn">
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

            {/* 2. Модалка створення/редагування (другий рівень) */}
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
                                <input
                                    type="text" className="calc-input" required
                                    value={catForm.name}
                                    onChange={e => setCatForm({...catForm, name: e.target.value})}
                                />
                            </div>
                            <div className="color-picker-row">
                                <label>Колір в системі</label>
                                <div className="color-input-wrapper">
                                    <input type="color" value={catForm.color} onChange={e => setCatForm({...catForm, color: e.target.value})} />
                                </div>
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
                            <p>Прайс-лист матеріалів успішно збережено.<br/>Дані синхронізовано з календарем.</p>
                            <button
                                className="wh-save-btn"
                                onClick={() => setShowSuccess(false)}
                            >
                                Зрозуміло
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};