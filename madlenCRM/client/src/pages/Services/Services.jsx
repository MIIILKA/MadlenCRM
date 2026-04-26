import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/';
import { useAuthStore } from '../../store/authStore';
import './Services.scss';

export default function Services() {
    const [services, setServices] = useState([]);
    const [staff, setStaff] = useState([]);
    // Додаємо стейт для категорій
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [visibleCount, setVisibleCount] = useState(6);
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState('service');
    const [editId, setEditId] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuthStore();
    const isAdmin = isAuthenticated && (user?.role === 'admin' || user?.role === 'owner');

    const [formData, setFormData] = useState({
        name: '', price: '', duration: '', category: '', description: '',
        role: '', email: '', avatar: null, phone: ''
    });

    const fetchData = async () => {
        try {
            // Тепер завантажуємо і категорії теж
            const [sRes, stRes, catRes] = await Promise.all([
                api.get('/services'),
                api.get('/staff'),
                api.get('/categories').catch(() => ({ data: [] })) // Заглушка, якщо роута ще немає
            ]);
            setServices(sRes.data);
            setStaff(stRes.data);
            setCategories(catRes.data);
            setLoading(false);
        } catch (err) {
            console.error("Fetch error:", err);
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const openModal = (mode, item = null) => {
        setModalMode(mode);
        setEditId(item?._id || null);
        setFilePreview(item?.avatar ? `https://madlencrm-backend.onrender.com/${item.avatar}` : null);

        // Виправляємо formData: ініціалізуємо всі поля, щоб не було undefined
        setFormData(item || {
            name: '', price: '', duration: '', category: '',
            description: '', role: '', email: '', avatar: null, phone: ''
        });
        setShowModal(true);
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setFormData({ ...formData, avatar: file });
            setFilePreview(URL.createObjectURL(file));
        }
    };

    const handleDelete = async (mode, id) => {
        if (!window.confirm('Видалити цей елемент?')) return;
        try {
            await api.delete(`/${mode === 'service' ? 'services' : 'staff'}/${id}`);
            fetchData();
        } catch (err) { alert("Помилка видалення"); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const endpoint = modalMode === 'service' ? '/services' : '/staff';

        try {
            let payload;

            if (modalMode === 'staff') {
                if (!formData.phone || formData.phone.length !== 13) {
                    alert("Помилка: Номер має бути у форматі +380XXXXXXXXX");
                    return;
                }
                payload = new FormData();
                payload.append('name', formData.name);
                payload.append('phone', formData.phone);
                payload.append('role', formData.role);
                if (formData.email) payload.append('email', formData.email);
                if (formData.avatar instanceof File) payload.append('avatar', formData.avatar);
            } else {
                // ФІКС: Отримуємо ID обраної категорії з масиву categories
                const selectedCat = categories.find(c => c.slug === formData.category || c._id === formData.category);

                payload = {
                    name: formData.name,
                    price: Number(formData.price),
                    duration: Number(formData.duration),
                    // Шлемо саме ID об'єкта, щоб бекенд прийняв його як посилання
                    category: selectedCat ? selectedCat._id : formData.category,
                    description: formData.description
                };
            }

            if (editId) {
                await api.put(`${endpoint}/${editId}`, payload);
            } else {
                await api.post(endpoint, payload);
            }

            setShowModal(false);
            fetchData();
        } catch (err) {
            console.error("❌ Помилка збереження:", err.response?.data || err.message);
            // Виводимо детальну помилку з сервера, щоб знати, що не так у моделі
            const serverMsg = err.response?.data?.message || "Не вдалося зберегти дані";
            alert(`Помилка збереження: ${serverMsg}`);
        }
    };



    const handleBooking = (s) => {
        if (!s || !s._id) return;
        if (!isAuthenticated) {
            navigate('/login');
        } else {
            navigate('/booking', { state: { service: s } });
        }
    };

    if (loading) return <div className="services-loading">MADLEN...</div>;

    return (
        <div className="services-page">
            <section className="services-hero">
                <div className="hero-content">
                    <h1>Madlen Studio</h1>
                    <div className="hero-actions">
                        <div className="admin-actions-hero">
                            <button className="btn-primary" onClick={() => document.getElementById('price-list').scrollIntoView({behavior: 'smooth'})}>Прайс-лист</button>
                            {isAdmin && (
                                <div>
                                    <button onClick={() => openModal('service')}>+ Послуга</button>
                                    <button onClick={() => openModal('staff')}>+ Майстер</button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="location-section">
                <div className="location-container">
                    <div className="location-info">
                        <h2 className="section-title">Контакти</h2>
                        <div className="info-item">
                            <span className="material-symbols-rounded">location_on</span>
                            <div><h3>Адреса</h3><p>Львів, вул. Тернопільська, 21є</p></div>
                        </div>
                        <div className="info-item">
                            <span className="material-symbols-rounded">schedule</span>
                            <div><h3>Графік</h3><p>Пн-Сб: 10:00 - 19:00</p></div>
                        </div>
                        <div className="info-item">
                            <span className="material-symbols-rounded">call</span>
                            <div><h3>Телефон</h3><p>+380 (96) 402 15 30</p></div>
                        </div>
                    </div>
                    <div className="map-box">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2574.686561011833!2d24.0322!3d49.8145!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473ae7f6f5b9d5b9%3A0x7d6f5b9d5b9d5b9!2z0KLQtdGA0L3QvtC_0ZbQu9GM0YHRjNC60LAsIDIx0LUsINCb0YzQstGW0LIsINCb0YzQstGW0LLRgdGM0LrQsCDQvtCx0LvQsNGB0YLRjCwgNzkwMDA!5e0!3m2!1suk!2sua!4v1713821000000!5m2!1suk!2sua"
                            width="100%"
                            height="100%"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy">
                        </iframe>
                    </div>
                </div>
            </section>

            <section className="staff-section">
                <h2 className="section-title center">Наші майстри</h2>
                <div className="staff-grid">
                    {staff.map((m, index) => (
                        <div key={m._id} className="staff-card" style={{animationDelay: `${index * 0.1}s`}}>
                            {isAdmin && (
                                <div className="card-admin-overlay">
                                    <button onClick={() => openModal('staff', m)} className="edit-btn"><span className="material-symbols-rounded">edit</span></button>
                                    <button onClick={() => handleDelete('staff', m._id)} className="del-btn"><span className="material-symbols-rounded">delete</span></button>
                                </div>
                            )}
                            <div className="staff-card__avatar">
                                {m.avatar ? (
                                    <img src={m.avatar.startsWith('http') ? m.avatar : `https://madlencrm-backend.onrender.com/${m.avatar}`} alt={m.name} />
                                ) : (
                                    <span className="avatar-letter">{m.name.charAt(0)}</span>
                                )}
                            </div>
                            <h3>{m.name}</h3>
                            <span className="role">{m.role}</span>
                        </div>
                    ))}
                </div>
            </section>

            <section id="price-list" className="services-container">
                <h2 className="section-title center">Послуги</h2>
                <div className="services-grid">
                    {services && Array.isArray(services) && services.length > 0 ? (
                        services.slice(0, visibleCount).map(s => (
                            <div key={s._id} className="service-card">
                                <div className="card-head">
                                    {/* Відображення категорії з динамічним кольором та захистом від [object Object] */}
                                    <span
                                        className="cat"
                                        style={{
                                            color: s.category?.color || '#D4AF37',
                                            borderLeft: `3px solid ${s.category?.color || '#D4AF37'}`,
                                            paddingLeft: '8px'
                                        }}
                                    >
                            {s.category?.name
                                ? s.category.name
                                : (typeof s.category === 'string' ? s.category : 'Без категорії')
                            }
                        </span>

                                    {isAdmin && (
                                        <div className="admin-actions-inline">
                                            <button onClick={() => openModal('service', s)}>
                                                <span className="material-symbols-rounded">edit</span>
                                            </button>
                                            <button onClick={() => handleDelete('service', s._id)}>
                                                <span className="material-symbols-rounded">delete</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <h3>{s.name}</h3>

                                <div className="card-foot">
                                    <span className="price">{s.price} ₴</span>
                                    <button
                                        type="button"
                                        className="book-btn"
                                        onClick={() => handleBooking(s)}
                                    >
                                        Записатись
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="no-services">Наразі немає доступних послуг</div>
                    )}
                </div>

                {services && visibleCount < services.length && (
                    <button
                        className="load-more btn-primary"
                        onClick={() => setVisibleCount(v => v + 6)}
                    >
                        Показати ще
                    </button>
                )}
            </section>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content admin-modal" onClick={e => e.stopPropagation()}>
                        <button className="absolute-close" onClick={() => setShowModal(false)}>
                            <span className="material-symbols-rounded">close</span>
                        </button>
                        <div className="modal-header">
                            <h2>{editId ? 'Редагувати' : 'Додати нове'}</h2>
                        </div>
                        <form onSubmit={handleSubmit} className="modern-form" noValidate>
                            {modalMode === 'staff' ? (
                                <>
                                    <div className="file-upload-container">
                                        <label htmlFor="avatar-upload" className="file-label preview-box">
                                            {filePreview ? <img src={filePreview} alt="Preview" className="staff-preview-img" /> : <span className="material-symbols-rounded">add_a_photo</span>}
                                        </label>
                                        <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} hidden />
                                    </div>
                                    <input type="text" placeholder="Ім'я майстра" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                    <input
                                        type="tel"
                                        placeholder="Номер телефону"
                                        required
                                        value={formData.phone}
                                        onFocus={() => { if (!formData.phone) setFormData({...formData, phone: '+380'}); }}
                                        onChange={e => {
                                            let val = e.target.value;
                                            if (!val.startsWith('+')) val = '+' + val.replace(/\D/g, '');
                                            const digitsOnly = val.slice(1).replace(/\D/g, '');
                                            if (digitsOnly.length <= 12) setFormData({...formData, phone: '+' + digitsOnly});
                                        }}
                                    />
                                    <input type="text" placeholder="Посада" required value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                                </>
                            ) : (
                                <>
                                    <input type="text" placeholder="Назва послуги" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    <div className="row">
                                        <input type="number" placeholder="Ціна" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                        <input type="number" placeholder="Хв" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                                    </div>
                                    <select
                                        value={typeof formData.category === 'object' ? formData.category._id : formData.category}
                                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                                    >
                                        <option value="">Оберіть категорію</option>
                                        {categories.map(cat => (
                                            <option key={cat._id} value={cat._id}>
                                                {cat.name}
                                            </option>
                                        ))}
                                    </select>
                                    <textarea placeholder="Опис" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                </>
                            )}
                            <button type="submit" className="submit-btn">Зберегти дані</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}