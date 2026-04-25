import axios from 'axios';

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const api = axios.create({
    baseURL: isLocal
        ? 'http://localhost:5000/api'
        : 'https://madlencrm-backend.onrender.com/api',
    withCredentials: true
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