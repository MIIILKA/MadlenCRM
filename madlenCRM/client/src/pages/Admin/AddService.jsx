import React, { useState } from 'react';
import api from '../../api';

const AddService = () => {
    const [form, setForm] = useState({ name: '', price: '', duration: '', category: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/services', form);
            alert('Послугу додано!');
            setForm({ name: '', price: '', duration: '', category: '' });
        } catch (err) {
            alert('Помилка при додаванні');
        }
    };

    return (
        <form className="admin-form" onSubmit={handleSubmit}>
            <input type="text" placeholder="Назва" onChange={e => setForm({...form, name: e.target.value})} />
            <input type="number" placeholder="Ціна" onChange={e => setForm({...form, price: e.target.value})} />
            <input type="number" placeholder="Хв" onChange={e => setForm({...form, duration: e.target.value})} />
            <button type="submit" className="btn-gold">Додати в БД</button>
        </form>
    );
};

export default AddService;