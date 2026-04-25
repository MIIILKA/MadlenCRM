import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import api from './api';
import { InstallPrompt } from "./common/InstallPrompt/InstallPrompt.jsx";
import { useAuthStore } from './store/authStore.js';
import Layout from './components/layout/Layout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Clients from './pages/Clients/Clients';
import Services from './pages/Services/Services';
import Calendar from './pages/Calendar/Calendar';
import Booking from './pages/Booking/Booking';
import Profile from './pages/Profile/Profile';
import ProtectedRoute from './components/ProtectedRoute';

// Функція конвертації ключа
function urlBase64ToUint8Array(base64String) {
    try {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    } catch (e) {
        console.error("Помилка VAPID ключа", e);
        return null;
    }
}

export default function App() {
    const { user } = useAuthStore();

    useEffect(() => {
        if (user) {
            // Якщо дозвіл вже є (Allowed), підписуємо мовчки
            if (Notification.permission === 'granted') {
                subscribeToNotifications();
            } else {
                console.log("--- 🚀 PUSH: Чекаю на ручний дозвіл або клік юзера ---");
            }
        }
    }, [user]);

    async function subscribeToNotifications() {
        if (!('serviceWorker' in navigator)) return;

        try {
            const registration = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;

            const permission = await Notification.requestPermission();
            if (permission !== 'granted') return;

            const VAPID_KEY_TEXT = 'BM9x9pO2KBX54FO46nOVeaBwUiTlXe1e8X0ag-hmPDOdIZxqR5Y5XLn7CmB0T5G8dzoV9mVwCBlKbAAKdAoanDQ';
            const convertedKey = urlBase64ToUint8Array(VAPID_KEY_TEXT.trim());

            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: convertedKey
            });

            console.log("✅ Підписка отримана:", subscription);
            await api.post('/auth/subscribe', subscription);
            console.log("✅ Дані в БД");

        } catch (err) {
            console.error("❌ Помилка Push:", err);
        }
    }

    return (
        <BrowserRouter>
            <InstallPrompt />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<Layout />}>
                    <Route index element={<Services />} />
                    <Route path="booking" element={<ProtectedRoute page="booking"><Booking /></ProtectedRoute>} />
                    <Route path="profile" element={
                        <ProtectedRoute page="profile">
                            <Profile subscribeToNotifications={subscribeToNotifications} />
                        </ProtectedRoute>
                    } />
                    <Route path="dashboard" element={<ProtectedRoute page="dashboard"><Dashboard /></ProtectedRoute>} />
                    <Route path="calendar" element={<ProtectedRoute page="calendar"><Calendar /></ProtectedRoute>} />
                    <Route path="clients" element={<ProtectedRoute page="clients"><Clients /></ProtectedRoute>} />
                    <Route path="staff" element={<ProtectedRoute page="staff"><div className="p-6"><h1>Staff Management</h1></div></ProtectedRoute>} />
                    <Route path="finance" element={<ProtectedRoute page="finance"><div className="p-6"><h1>Finance & Analytics</h1></div></ProtectedRoute>} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}