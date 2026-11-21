import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { isoToDisplay } from '../components/DateInput';

export default function ManageUsers({ onNotify, onSelectUserCatalog }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [editingUser, setEditingUser] = useState(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    email: '',
    role: 'user',
    status: 'active',
    organization: '',
    phone: ''
  });

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getUsers(user);
      setUsers(data);
    } catch (err) {
      if (onNotify) onNotify('Error loading users: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, onNotify]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const openEditModal = (u) => {
    setEditingUser(u);
    setEditFormData({
      name: u.name,
      email: u.email,
      role: u.role,
      organization: u.organization || '',
      phone: u.phone || ''
    });
  };

  const handleEditChange = (e) => {
    setEditFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await api.updateUser(user, editingUser.id, editFormData);
      setEditingUser(null);
      loadUsers();
      if (onNotify) onNotify(`User "${editFormData.name}" updated successfully.`);
    } catch (err) {
      if (onNotify) onNotify('Failed to update user: ' + err.message, 'error');
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.id === user.id) {
      if (onNotify) onNotify('You cannot delete your own active administrator account.', 'error');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${u.name}" (${u.email})? This will also remove their associated catalog items.`)) {
      return;
    }
    try {
      await api.deleteUser(user, u.id);
      loadUsers();
      if (onNotify) onNotify(`Account for "${u.name}" deleted.`);
    } catch (err) {
      if (onNotify) onNotify('Failed to delete user: ' + err.message, 'error');
    }
  };

  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.organization && u.organization.toLowerCase().includes(q))
    );
  });

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            Manage User Accounts & Access Rights
          </h2>
          <p className="section-subtitle">
            Supervise registered medical clinics, edit user credentials, or manage their inventory data directly.
          </p>
        </div>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '1rem' }}
            placeholder="Search accounts by name, email, or clinic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th>User and Medical Center</th>
                <th>Contact Info</th>
                <th>Role & Rights</th>
                <th>Catalog Items</th>
                <th>Registered</th>
                <th style={{ textAlign: 'right' }}>Administrative Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    Loading user accounts...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                    No user accounts found matching your query.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(u => (
                  <tr key={u.id}>
                    <td>
                      <strong style={{ fontSize: '0.95rem', color: '#fff', textTransform: 'capitalize' }}>{u.name}</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--teal-primary)', textTransform: 'capitalize' }}>
                        {u.organization || 'Independent Practice'}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{u.email}</div>
                      {u.phone && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          Phone: {u.phone}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className={`role-badge ${u.role}`}>
                        {u.role === 'admin' ? 'Administrator' : 'Clinic User'}
                      </span>
                    </td>

                    <td>
                      <strong>{u.itemCount || 0}</strong> medicines
                    </td>

                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                        {u.createdAt ? isoToDisplay(u.createdAt) : 'N/A'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Manage this user's inventory catalog"
                          onClick={() => onSelectUserCatalog(u.id)}
                        >
                          View Catalog
                        </button>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Edit User Account Details"
                          onClick={() => openEditModal(u)}
                        >
                          Edit
                        </button>
                        {u.id !== user?.id && (
                          <button
                            className="btn btn-danger btn-sm"
                            title="Delete User Account"
                            onClick={() => handleDeleteUser(u)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingUser && (
        <div className="modal-overlay" onClick={() => setEditingUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit User Account: {editingUser.name}</h3>
              <button className="modal-close" onClick={() => setEditingUser(null)}>Close</button>
            </div>
            <form onSubmit={handleSaveUser}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Full Name & Professional Title</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="form-control"
                    value={editFormData.name}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="form-control"
                    value={editFormData.email}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Account Role</label>
                  <select
                    name="role"
                    className="form-control"
                    value={editFormData.role}
                    onChange={handleEditChange}
                  >
                    <option value="user">Clinic User (Standard Access)</option>
                    <option value="admin">System Administrator (Full Control)</option>
                  </select>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Healthcare Facility / Organization</label>
                    <input
                      type="text"
                      name="organization"
                      className="form-control"
                      value={editFormData.organization}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone Contact</label>
                    <input
                      type="text"
                      name="phone"
                      className="form-control"
                      value={editFormData.phone}
                      onChange={handleEditChange}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditingUser(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Account Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
