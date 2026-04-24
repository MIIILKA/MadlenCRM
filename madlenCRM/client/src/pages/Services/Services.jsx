import React, { useState, useEffect } from 'react';

import { useNavigate } from 'react-router-dom';

import api from '../../api/';

import { useAuthStore } from '../../store/authStore';

import './Services.scss';



export default function Services() {

    const [services, setServices] = useState([]);

    const [staff, setStaff] = useState([]);

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

        role: '', email: '', avatar: null

    });



    const fetchData = async () => {

        try {

            const [sRes, stRes] = await Promise.all([

                api.get('/services'),

                api.get('/staff')

            ]);

            setServices(sRes.data);

            setStaff(stRes.data);

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

        setFilePreview(item?.avatar ? `http://localhost:5000/${item.avatar}` : null);

        setFormData(item || { name: '', price: '', duration: '', category: '', description: '', role: '', email: '', avatar: null });

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
                payload = new FormData();
                // Цей цикл автоматично додасть name, email, role та твій новий phone
                Object.keys(formData).forEach(key => {
                    if (formData[key] !== null) {
                        payload.append(key, formData[key]);
                    }
                });
            } else {
                payload = formData;
            }

            if (editId) await api.put(`${endpoint}/${editId}`, payload);
            else await api.post(endpoint, payload);

            setShowModal(false);
            fetchData();
        } catch (err) {
            alert("Помилка збереження!");
        }
    };


    const handleBooking = (s) => {
        // 1. Перевірка в консолі (ти маєш побачити це в F12)
        console.log("--- DEBUG BOOKING ---");
        console.log("Послуга:", s);
        console.log("Авторизація:", isAuthenticated);

        if (!s || !s._id) {
            alert("Помилка: Послуга не знайдена");
            return;
        }

        if (!isAuthenticated) {
            console.log("Редирект на логін...");
            navigate('/login');
            // Якщо navigate не спрацював, штовхаємо силою:
            // window.location.href = '/login';
        } else {
            console.log("Перехід на букінг...");
            navigate('/booking', { state: { service: s } });
        }
    };

// ТОЧНІ КООРДИНАТИ ТЕРНОПІЛЬСЬКОЇ 21Є

    const mapSrc = "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2573.308708170889!2d24.012543315707!3d49.83592187939494!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x473add70f5e38167%3A0x66c5d6c8b9195b0c!2z0LLRg9C70LjRhtGPINCh0YLQtdC_0LDQvdCwINCR0LDQvdC00LXRgNC4LCAxMiwg0JvRjNCy0ZbQsiwg0JvRjNCy0ZbQstGB0YzQutCwINC-0LHQuy4sIDc5MDAw!5e0!3m2!1suk!2sua!4v1700000000000!5m2!1suk!2sua4";



    if (loading) return <div className="services-loading">MADLEN...</div>;



    return (

        <div className="services-page">

            <section className="services-hero">

                <div className="hero-content">

                    <h1>Madlen Studio</h1>

                    <div className="hero-actions">

                        <button className="btn-primary" onClick={() => document.getElementById('price-list').scrollIntoView({behavior: 'smooth'})}>Прайс-лист</button>

                        {isAdmin && (

                            <div className="admin-actions-hero">

                                <button onClick={() => openModal('service')}>+ Послуга</button>

                                <button onClick={() => openModal('staff')}>+ Майстер</button>

                            </div>

                        )}

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

                            src="https://maps.google.com/maps?q=Студія%20краси%20Madlen%20Львів%20Тернопільська%2021є&t=&z=17&ie=UTF8&iwloc=&output=embed" width="100%"

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

                                {m.avatar ? <img src={`http://localhost:5000/${m.avatar}`} alt={m.name} /> : m.name.charAt(0)}

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

                    {services.slice(0, visibleCount).map(s => (

                        <div key={s._id} className="service-card">

                            <div className="card-head">

                                <span className="cat">{s.category}</span>

                                {isAdmin && (

                                    <div className="admin-actions-inline">

                                        <button onClick={() => openModal('service', s)}><span className="material-symbols-rounded">edit</span></button>

                                        <button onClick={() => handleDelete('service', s._id)}><span className="material-symbols-rounded">delete</span></button>

                                    </div>

                                )}

                            </div>

                            <h3>{s.name}</h3>

                            <div className="card-foot">

                                <span className="price">{s.price} ₴</span>

                                <button
                                    type="button"
                                    className="book-btn"
                                    style={{ cursor: 'pointer', pointerEvents: 'auto' }} // Гарантуємо клікабельність
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleBooking(s);
                                    }}
                                >
                                    Записатись
                                </button>
                            </div>

                        </div>

                    ))}

                </div>

                {visibleCount < services.length && (

                    <button className="load-more" onClick={() => setVisibleCount(v => v + 6)}>Показати ще</button>

                )}

            </section>



            {showModal && (

                <div className="modal-overlay" onClick={() => setShowModal(false)}>

                    <div className="modal-content" onClick={e => e.stopPropagation()}>

                        <div className="modal-header">

                            <h2>{editId ? 'Редагувати' : 'Додати нове'}</h2>

                            <button className="close-btn" onClick={() => setShowModal(false)}><span className="material-symbols-rounded">close</span></button>

                        </div>

                        <form onSubmit={handleSubmit} className="modern-form">
                            {modalMode === 'staff' ? (
                                <>
                                    <div className="file-upload-container">
                                        <label htmlFor="avatar-upload" className="file-label">
                                            {filePreview ? <img src={filePreview} alt="Preview" /> : <span className="material-symbols-rounded">add_a_photo</span>}
                                            <p>Фото майстра</p>
                                        </label>
                                        <input id="avatar-upload" type="file" accept="image/*" onChange={handleFileChange} hidden />
                                    </div>
                                    <input type="text" placeholder="Ім'я" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    <input type="email" placeholder="Email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                                    <input type="tel" placeholder="Номер телефону (напр. +380...)" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                    <input type="text" placeholder="Роль" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} />
                                </>
                            ) : (
                                <>
                                    <input type="text" placeholder="Назва послуги" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                                    <div className="row">
                                        <input type="number" placeholder="Ціна" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                                        <input type="number" placeholder="Хв" value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                                    </div>
                                    <input type="text" placeholder="Категорія" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} />
                                    <textarea placeholder="Опис" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                                </>
                            )}
                            <button type="submit" className="submit-btn">Зберегти</button>
                        </form>

                    </div>

                </div>

            )}

        </div>

    );

}