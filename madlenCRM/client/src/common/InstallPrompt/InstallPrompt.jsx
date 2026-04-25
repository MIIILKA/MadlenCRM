import React, { useState, useEffect } from 'react';
import './InstallPrompt.scss';

export const InstallPrompt = () => {
    const [showPrompt, setShowPrompt] = useState(false);

    useEffect(() => {
        // Перевірка: чи це iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        // Перевірка: чи додаток ВЖЕ не запущений як PWA
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;

        if (isIOS && !isStandalone) {
            setShowPrompt(true);
        }
    }, []);

    if (!showPrompt) return null;

    return (
        <div className="ios-prompt">
            <div className="ios-prompt__content">
                <button className="close-btn" onClick={() => setShowPrompt(false)}>×</button>
                <p>Встанови <strong>Madlen CRM</strong> на робочий стіл:</p>
                <div className="instructions">
                    <span>1. Натисни кнопку <strong>«Поділитися»</strong> <i className="share-icon"></i></span>
                    <span>2. Обери <strong>«Додати на початковий екран»</strong> <i className="add-icon"></i></span>
                </div>
            </div>
            <div className="ios-prompt__arrow"></div>
        </div>
    );
};