import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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


export default function App() {
    return (
        <BrowserRouter>
            {/* InstallPrompt розміщуємо тут.
                Він буде перевіряти пристрій один раз при завантаженні
                і покажеться, якщо користувач зайшов з iPhone Safari.
            */}
            <InstallPrompt />

            <Routes>
                {/* Логін окремим вікном без меню */}
                <Route path="/login" element={<Login />} />

                {/* Основна частина додатку з Sidebar та Topbar */}
                <Route path="/" element={<Layout />}>
                    {/* Головна сторінка — список послуг (доступна всім) */}
                    <Route index element={<Services />} />

                    {/* Сторінка бронювання (доступна всім авторизованим) */}
                    <Route path="booking" element={
                        <ProtectedRoute page="booking">
                            <Booking />
                        </ProtectedRoute>
                    } />

                    {/* Особистий кабінет (Профіль) */}
                    <Route path="profile" element={
                        <ProtectedRoute page="profile">
                            <Profile />
                        </ProtectedRoute>
                    } />

                    {/* Захищені роути — перевіряють токен та роль */}
                    <Route path="dashboard" element={
                        <ProtectedRoute page="dashboard">
                            <Dashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="calendar" element={
                        <ProtectedRoute page="calendar">
                            <Calendar />
                        </ProtectedRoute>
                    } />

                    <Route path="clients" element={
                        <ProtectedRoute page="clients">
                            <Clients />
                        </ProtectedRoute>
                    } />

                    {/* Керування персоналом (Admin/Owner) */}
                    <Route path="staff" element={
                        <ProtectedRoute page="staff">
                            <div className="p-6">
                                <h1>Staff Management</h1>
                                <p>Тут буде список та редагування майстрів</p>
                            </div>
                        </ProtectedRoute>
                    } />

                    {/* Фінанси та аналітика (тільки для Owner) */}
                    <Route path="finance" element={
                        <ProtectedRoute page="finance">
                            <div className="p-6">
                                <h1>Finance & Analytics</h1>
                                <p>Доступ обмежено: тільки для власника</p>
                            </div>
                        </ProtectedRoute>
                    } />
                </Route>

                {/* Редірект на головну, якщо ввели неіснуючу адресу */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}