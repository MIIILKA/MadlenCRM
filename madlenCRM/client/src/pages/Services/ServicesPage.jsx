import React, { useState, useEffect } from 'react';
import api from '../api/axios'; // твій налаштований axios

const ServicesPage = () => {
    const [services, setServices] = useState([]);
    const [formData, setFormData] = useState({
        name: '',
        price: '',
        duration: '',
        category: ''
    });

    // 1. Завантаження послуг при відкритті сторінки
    const fetchServices = async () => {
        try {
            const res = await api.get('/services');
            setServices(res.data);
        } catch (err) {
            console.error("Помилка завантаження:", err);
        }
    };

    useEffect(() => {
        fetchServices();
    }, []);

    // 2. Обробка введення в форму
    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. Відправка форми на бекенд
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/services', formData);
            alert("Послугу додано!");
            setFormData({ name: '', price: '', duration: '', category: '' }); // Очистка
            fetchServices(); // Оновлюємо список
        } catch (err) {
            alert("Помилка: " + err.response?.data?.message);
        }
    };

    return (
        <div className="p-6 bg-gray-900 min-h-screen text-white">
            <h1 className="text-2xl font-bold mb-6">Управління послугами</h1>

            {/* Форма додавання */}
            <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg mb-8 shadow-lg max-w-md">
                <h2 className="text-xl mb-4 text-blue-400">Додати нову послугу</h2>
                <div className="space-y-4">
                    <input
                        name="name" placeholder="Назва послуги" value={formData.name}
                        onChange={handleChange} required
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                    />
                    <div className="flex gap-4">
                        <input
                            name="price" type="number" placeholder="Ціна (грн)" value={formData.price}
                            onChange={handleChange} required
                            className="w-1/2 p-2 bg-gray-700 border border-gray-600 rounded"
                        />
                        <input
                            name="duration" type="number" placeholder="Хв" value={formData.duration}
                            onChange={handleChange} required
                            className="w-1/2 p-2 bg-gray-700 border border-gray-600 rounded"
                        />
                    </div>
                    <input
                        name="category" placeholder="Категорія (напр. Манікюр)" value={formData.category}
                        onChange={handleChange}
                        className="w-full p-2 bg-gray-700 border border-gray-600 rounded"
                    />
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 p-2 rounded font-bold transition">
                        Зберегти послугу
                    </button>
                </div>
            </form>

            {/* Список послуг */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map(service => (
                    <div key={service._id} className="bg-gray-800 p-4 rounded border-l-4 border-blue-500 shadow">
                        <h3 className="font-bold text-lg">{service.name}</h3>
                        <p className="text-gray-400">{service.category}</p>
                        <div className="mt-2 flex justify-between items-center">
                            <span className="text-green-400 font-bold">{service.price} грн</span>
                            <span className="text-sm text-gray-500">{service.duration} хв</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ServicesPage;