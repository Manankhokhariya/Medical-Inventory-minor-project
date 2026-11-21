import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  IconCross,
  IconDashboard,
  IconPill,
  IconUsers,
  IconLogs,
  IconSignOut,
  IconSignIn
} from './Icons';

export default function Navbar({ activePage, setActivePage, onOpenAuth }) {
  const { user, logout } = useAuth();

  const handleBrandClick = () => {
    if (!user) {
      setActivePage('home');
    } else if (user.role === 'admin') {
      setActivePage('admin-dashboard');
    } else {
      setActivePage('user-dashboard');
    }
  };

  return (
    <header className="navbar">
      <div className="navbar-inner">
        <div className="nav-brand" onClick={handleBrandClick}>
          <div className="brand-symbol">
            <IconCross size={20} strokeWidth={2.5} />
          </div>
          <div className="brand-text">
            <h1>MediFlow</h1>
            <span>Inventory Core</span>
          </div>
        </div>

        <nav className="nav-links">
          {!user && (
            <button
              className={`nav-btn ${activePage === 'home' ? 'active' : ''}`}
              onClick={() => setActivePage('home')}
            >
              Overview
            </button>
          )}

          {user && user.role === 'user' && (
            <>
              <button
                className={`nav-btn ${activePage === 'user-dashboard' ? 'active' : ''}`}
                onClick={() => setActivePage('user-dashboard')}
              >
                <IconDashboard size={15} />
                Dashboard
              </button>
              <button
                className={`nav-btn ${activePage === 'manage-catalog' ? 'active' : ''}`}
                onClick={() => setActivePage('manage-catalog')}
              >
                <IconPill size={15} />
                Catalog
              </button>
            </>
          )}

          {user && user.role === 'admin' && (
            <>
              <button
                className={`nav-btn ${activePage === 'admin-dashboard' ? 'active' : ''}`}
                onClick={() => setActivePage('admin-dashboard')}
              >
                <IconDashboard size={15} />
                Admin
              </button>
              <button
                className={`nav-btn ${activePage === 'manage-users' ? 'active' : ''}`}
                onClick={() => setActivePage('manage-users')}
              >
                <IconUsers size={15} />
                Users
              </button>
              <button
                className={`nav-btn ${activePage === 'manage-logs' ? 'active' : ''}`}
                onClick={() => setActivePage('manage-logs')}
              >
                <IconLogs size={15} />
                Audit Logs
              </button>
              <button
                className={`nav-btn ${activePage === 'manage-catalog' ? 'active' : ''}`}
                onClick={() => setActivePage('manage-catalog')}
              >
                <IconPill size={15} />
                All Catalogs
              </button>
            </>
          )}
        </nav>

        <div className="nav-auth-section">
          {user ? (
            <>
              <div className="user-pill">
                <div className="user-avatar">
                  {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="user-pill-info">
                  <span className="user-pill-name">
                    {user.name || 'User'}
                  </span>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? 'Admin' : 'Clinic'}
                  </span>
                </div>
              </div>
              <button
                className="btn btn-outline btn-sm"
                onClick={logout}
                title="Sign out of account"
              >
                <IconSignOut size={14} />
                Sign Out
              </button>
            </>
          ) : (
            <button className="btn btn-primary btn-sm" onClick={onOpenAuth}>
              <IconSignIn size={14} />
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
