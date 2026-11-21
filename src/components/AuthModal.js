import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { IconClose } from './Icons';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const { login, register, authError, setAuthError } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    organization: '',
    phone: ''
  });

  if (!isOpen) return null;

  const handleChange = (e) => {
    setLocalError(null);
    setAuthError(null);
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleClose = () => {
    setLocalError(null);
    setAuthError(null);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    setAuthError(null);

    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanPassword = formData.password;

    if (!cleanEmail || !cleanPassword) {
      setLocalError('Please enter both email and password.');
      return;
    }

    if (isRegister && !formData.name.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register({
          name: formData.name.trim(),
          email: cleanEmail,
          password: cleanPassword,
          role: 'user',
          organization: formData.organization.trim(),
          phone: formData.phone.trim()
        });
      } else {
        await login(cleanEmail, cleanPassword);
      }
      handleClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      setLocalError(err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const displayError = localError || authError;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{isRegister ? 'Create Account' : 'Sign In'}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {isRegister ? 'Register your account credentials' : 'Access your medical inventory catalog'}
            </p>
          </div>
          <button className="modal-close" onClick={handleClose} aria-label="Close modal">
            <IconClose size={18} />
          </button>
        </div>

        {/* Tab switcher */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-subtle)',
          padding: '0 1.5rem',
          background: 'rgba(0, 0, 0, 0.15)'
        }}>
          <button
            type="button"
            onClick={() => { setIsRegister(false); setAuthError(null); setLocalError(null); }}
            style={{
              flex: 1,
              padding: '0.75rem 0',
              background: 'none',
              border: 'none',
              borderBottom: !isRegister ? '2px solid var(--primary)' : '2px solid transparent',
              color: !isRegister ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setAuthError(null); setLocalError(null); }}
            style={{
              flex: 1,
              padding: '0.75rem 0',
              background: 'none',
              border: 'none',
              borderBottom: isRegister ? '2px solid var(--primary)' : '2px solid transparent',
              color: isRegister ? '#fff' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Register Account
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {displayError && (
              <div className="alert-banner alert-banner-danger" style={{ marginBottom: '1rem' }}>
                <span>{displayError}</span>
              </div>
            )}

            {isRegister && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Dr. Robert Chen"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                placeholder="name@organization.com"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                name="password"
                required
                autoComplete={isRegister ? "new-password" : "current-password"}
                placeholder="••••••••"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {isRegister && (
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Facility / Clinic Name (Optional)</label>
                  <input
                    type="text"
                    name="organization"
                    placeholder="e.g. Metro Care Clinic"
                    className="form-control"
                    value={formData.organization}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone (Optional)</label>
                  <input
                    type="text"
                    name="phone"
                    placeholder="+1 555-0100"
                    className="form-control"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Processing...' : (isRegister ? 'Create Account' : 'Sign In')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
