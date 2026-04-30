import React, { useState } from 'react';
import api from '../../../api';
import './AIBeauty.scss';

export const AIBeautyConsultant = () => {
    const [category, setCategory] = useState('hair');
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [advice, setAdvice] = useState('');
    const [loading, setLoading] = useState(false);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreview(URL.createObjectURL(selected));
        }
    };

    const getAdvice = async () => {
        if (!file) return;
        setLoading(true);
        setAdvice('');

        const formData = new FormData();
        formData.append('image', file);
        formData.append('category', category);

        try {
            const res = await api.post('/ai/analyze', formData);

            // Чистимо текст від можливих залишків розмітки ШІ
            const cleanText = res.data.advice.replace(/[\*\#]/g, '');
            setAdvice(cleanText);

        } catch (err) {
            setAdvice("Слухай, щось сервіс приліг. Спробуй ще раз за хвилину!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="ai-consultant-card">
            <div className="ai-header">
                <span className="material-symbols-rounded">auto_awesome</span>
                <h3>Madlen AI Стиліст</h3>
            </div>

            <p className="ai-desc">Завантаж фото, і я підкажу, що тобі намутити зі стилем.</p>

            <div className="category-tabs">
                {['hair', 'color', 'nails'].map(t => (
                    <button
                        key={t}
                        className={category === t ? 'active' : ''}
                        onClick={() => setCategory(t)}
                    >
                        {t === 'hair' ? 'Стрижка' : t === 'color' ? 'Колір' : 'Манікюр'}
                    </button>
                ))}
            </div>

            <div className="upload-zone">
                {preview ? (
                    <img src={preview} alt="Preview" className="img-preview" />
                ) : (
                    <label className="file-label">
                        <input type="file" onChange={handleFileChange} accept="image/*" hidden />
                        <span className="material-symbols-rounded">add_a_photo</span>
                        <p>Додай своє фото</p>
                    </label>
                )}
            </div>

            <button
                className="ai-submit-btn"
                onClick={getAdvice}
                disabled={!file || loading}
            >
                {loading ? 'Дивлюсь...' : 'Отримати пораду'}
            </button>

            {advice && (
                <div className="ai-response-box">
                    <div className="ai-badge">Порада від бро</div>
                    <p style={{ whiteSpace: 'pre-line', lineHeight: '1.5' }}>
                        {advice}
                    </p>
                    <button className="book-shortcut" onClick={() => window.location.href='/booking'}>
                        Записатись на цей образ
                    </button>
                </div>
            )}
        </div>
    );
};