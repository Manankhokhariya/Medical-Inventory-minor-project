import React from 'react';
import { useAuth } from '../context/AuthContext';
import { IconArrowRight } from '../components/Icons';

export default function HomePage({ setActivePage, onOpenAuth }) {
  const { user } = useAuth();

  return (
    <div className="hero-section">
      <h1 className="hero-title">
        Simple, Elegant <br />
        <span className="hero-title-gradient">Medical Inventory & Catalog</span>
      </h1>

      <p className="hero-desc">
        A unified management portal for medical clinics, pharmacies, and health administrators.
        Multi-tenant isolation, real-time threshold monitoring, and comprehensive audit accountability.
      </p>

      <div className="hero-actions">
        {user ? (
          <button
            className="btn btn-primary btn-lg"
            onClick={() => setActivePage(user.role === 'admin' ? 'admin-dashboard' : 'user-dashboard')}
          >
            Go to {user.role === 'admin' ? 'Admin Dashboard' : 'Clinic Dashboard'}
            <IconArrowRight size={16} />
          </button>
        ) : (
          <button
            className="btn btn-primary btn-lg"
            onClick={onOpenAuth}
          >
            Sign In / Register
            <IconArrowRight size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

