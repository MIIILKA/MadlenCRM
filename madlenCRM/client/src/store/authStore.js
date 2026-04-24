import { create } from 'zustand'
import api from '../api'

// ─── Permissions per role ──────────────────
export const ROLE_PERMISSIONS = {
    owner: {
        nav: ['dashboard', 'calendar', 'clients', 'staff', 'services', 'finance', 'inventory', 'loyalty', 'analytics', 'settings'],
        label: 'Owner',
        color: '#C9A84C',
    },
    admin: {
        nav: ['dashboard', 'calendar', 'clients', 'staff', 'services', 'finance', 'inventory', 'loyalty', 'analytics'],
        label: 'Admin',
        color: '#5B8DEF',
    },
    master: {
        nav: ['calendar', 'clients'],
        label: 'Master',
        color: '#4CAF7D',
    },
    receptionist: {
        nav: ['dashboard', 'calendar', 'clients', 'services'],
        label: 'Receptionist',
        color: '#A78BFA',
    },
    user: {
        nav: ['services', 'calendar'],
        label: 'Client',
        color: '#FFD700',
    }
}

export const useAuthStore = create((set) => ({
    user: (() => {
        try { return JSON.parse(localStorage.getItem('user')) || null; }
        catch { return null; }
    })(),
    isAuthenticated: !!localStorage.getItem('token'),
    loading: false,

    // Логін — loginValue може бути email або телефон
    login: async (loginValue, password) => {
        set({ loading: true });
        try {
            const response = await api.post('/auth/login', { loginValue, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            set({ user, isAuthenticated: true, loading: false });
            return { ok: true };
        } catch (error) {
            set({ loading: false });
            return {
                ok: false,
                error: error.response?.data?.message || 'Невірний логін або пароль'
            };
        }
    },

    // Реєстрація — надсилає { name, loginValue, password }
    // loginValue — email або телефон (бекенд сам розбере)
    register: async ({ name, loginValue, password }) => {
        set({ loading: true });
        try {
            const response = await api.post('/auth/register', { name, loginValue, password });
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

            set({ user, isAuthenticated: true, loading: false });
            return { ok: true };
        } catch (error) {
            set({ loading: false });
            return {
                ok: false,
                error: error.response?.data?.message || 'Помилка при реєстрації'
            };
        }
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        set({ user: null, isAuthenticated: false });
    },

    checkAuth: () => {
        const token = localStorage.getItem('token');
        const rawUser = localStorage.getItem('user');
        if (token && rawUser) {
            try {
                const user = JSON.parse(rawUser);
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
                set({ user, isAuthenticated: true });
            } catch {
                // Пошкоджені дані — очищаємо
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                set({ user: null, isAuthenticated: false });
            }
        }
    }
}))