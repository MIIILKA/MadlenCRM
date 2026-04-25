import axios from 'axios';

// Створюємо інстанс axios з базовими налаштуваннями
const api = axios.create({
    baseURL: 'https://madlencrm-backend.onrender.com',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Перехоплювач запитів (Interceptors)
// Він буде автоматично додавати токен у заголовок кожного запиту, якщо він є
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Перехоплювач відповідей
// Наприклад, якщо сервер повернув 401 (токен протух), ми можемо розлогінити юзера
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            // Можна додати логіку автоматичного Logout, якщо токен недійсний
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;