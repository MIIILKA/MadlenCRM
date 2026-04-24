import React, { useState, useEffect } from 'react';
import api from '../../api/';
import './Prices.scss';

export default function Prices() {
    const [services, setServices] = useState([]);
    useEffect(() => {
        api.get('/services').then(res => setServices(res.data));
    }, []);

    return (
        <div className="prices-page p-8">
            <h1 className="text-3xl font-bold mb-8 text-white">Повний прайс-лист</h1>
            <div className="table-container bg-[#1a1a1a] rounded-xl overflow-hidden border border-gray-800">
                <table className="w-full text-left">
                    <thead className="bg-[#111] text-gold border-b border-gray-800">
                    <tr>
                        <th className="p-4 uppercase text-xs tracking-widest text-[#d4af37]">Категорія</th>
                        <th className="p-4 uppercase text-xs tracking-widest text-[#d4af37]">Послуга</th>
                        <th className="p-4 uppercase text-xs tracking-widest text-[#d4af37]">Тривалість</th>
                        <th className="p-4 uppercase text-xs tracking-widest text-[#d4af37]">Ціна</th>
                    </tr>
                    </thead>
                    <tbody className="text-gray-300">
                    {services.map(s => (
                        <tr key={s._id} className="border-b border-gray-800/50 hover:bg-white/5 transition">
                            <td className="p-4 text-xs font-bold text-gray-500">{s.category}</td>
                            <td className="p-4 font-semibold text-white">{s.name}</td>
                            <td className="p-4 text-sm">{s.duration} хв</td>
                            <td className="p-4 font-black text-white">{s.price} ₴</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}