import React, { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore, ROLE_PERMISSIONS } from '../../store/authStore'
import './Layout.scss'

export default function Layout() {
    const { user, isAuthenticated, logout } = useAuthStore()
    const [collapsed, setCollapsed] = useState(false)
    const location = useLocation()
    const navigate = useNavigate()

    const ALL_LINKS = [
        { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
        { id: 'calendar',  label: 'Calendar',  icon: 'calendar_month', path: '/calendar' },
        { id: 'clients',   label: 'Clients',   icon: 'group', path: '/clients' },
        { id: 'services',  label: 'Services',  icon: 'category', path: '/' },
        { id: 'staff',     label: 'Staff',     icon: 'badge', path: '/staff' },
        { id: 'finance',   label: 'Finance',   icon: 'payments', path: '/finance' },
        // Додаємо профіль у загальний список для зручності
        { id: 'profile',   label: 'Profile',   icon: 'person', path: '/profile' },
    ]

    const allowedNav = isAuthenticated && user?.role
        ? ROLE_PERMISSIONS[user.role]?.nav || []
        : ['services']

    return (
        <div className={`layout ${collapsed ? 'layout--collapsed' : ''}`}>
            <aside className="sidebar">
                <div className="sidebar__logo">
                    <div className="sidebar__logo-mark">✦</div>
                    {!collapsed && (
                        <div className="sidebar__logo-text">
                            <span className="sidebar__logo-name">Madlen</span>
                            <span className="sidebar__logo-sub">CRM</span>
                        </div>
                    )}
                </div>

                <nav className="sidebar__nav">
                    <div className="sidebar__group">
                        {!collapsed && <span className="sidebar__group-label">Main Menu</span>}
                        {ALL_LINKS.map(link => {
                            if (!allowedNav.includes(link.id)) return null
                            const isActive = location.pathname === link.path
                            return (
                                <Link
                                    key={link.id}
                                    to={link.path}
                                    className={`sidebar__link ${isActive ? 'sidebar__link--active' : ''}`}
                                >
                                    <span className="material-symbols-rounded sidebar__link-icon">{link.icon}</span>
                                    {!collapsed && <span className="sidebar__link-label">{link.label}</span>}
                                </Link>
                            )
                        })}
                    </div>
                </nav>

                <div className="sidebar__footer">
                    {isAuthenticated && user ? (
                        <div className="sidebar__user-container">
                            {/* Клікабельна зона профілю */}
                            <div
                                className={`sidebar__user ${location.pathname === '/profile' ? 'sidebar__user--active' : ''}`}
                                onClick={() => navigate('/profile')}
                            >
                                <div
                                    className="sidebar__user-avatar"
                                    style={{ background: ROLE_PERMISSIONS[user.role]?.color || '#ccc' }}
                                >
                                    {user.avatar || user.name?.charAt(0)}
                                </div>
                                {!collapsed && (
                                    <div className="sidebar__user-info">
                                        <span className="sidebar__user-name">{user.name}</span>
                                        <span className="sidebar__user-role">{ROLE_PERMISSIONS[user.role]?.label}</span>
                                    </div>
                                )}
                            </div>

                            {/* Окрема кнопка виходу з нормальним дизайном */}
                            {!collapsed && (
                                <button className="sidebar__logout-btn" onClick={logout}>
                                    <span className="material-symbols-rounded">logout</span>
                                    <span>Logout</span>
                                </button>
                            )}
                        </div>
                    ) : (
                        <button className="sidebar__login-btn" onClick={() => navigate('/login')}>
                            <span className="material-symbols-rounded">login</span>
                            {!collapsed && <span>Sign In</span>}
                        </button>
                    )}

                    <button className="sidebar__collapse-toggle" onClick={() => setCollapsed(!collapsed)}>
                        <span className="material-symbols-rounded">
                            {collapsed ? 'side_navigation' : 'keyboard_double_arrow_left'}
                        </span>
                    </button>
                </div>
            </aside>

            <main className="layout__main">
                <header className="topbar">
                    <div className="topbar__left">
                        <h2 className="topbar__title">
                            {ALL_LINKS.find(l => l.path === location.pathname)?.label || 'Madlen CRM'}
                        </h2>
                    </div>
                    <div className="topbar__right">
                        <div className="topbar__actions">
                            <button className="topbar__btn">
                                <span className="material-symbols-rounded">search</span>
                            </button>
                            <button className="topbar__btn" onClick={() => navigate('/profile')}>
                                <span className="material-symbols-rounded">person</span>
                            </button>
                            <button className="topbar__btn">
                                <span className="material-symbols-rounded">notifications</span>
                                <div className="topbar__badge">2</div>
                            </button>
                        </div>
                    </div>
                </header>

                <div className="layout__content">
                    <Outlet />
                </div>
            </main>
        </div>
    )
}