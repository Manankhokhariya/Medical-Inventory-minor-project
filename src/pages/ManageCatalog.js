import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import DateInput, { isoToDisplay } from '../components/DateInput';

const DEFAULT_CATEGORIES = [
  'All',
  'Antibiotics',
  'Analgesics',
  'Cardiovascular',
  'Endocrinology',
  'Respiratory',
  'Antiseptics',
  'Vitamins & Supplements',
  'Dermatology',
  'General'
];

export default function ManageCatalog({ onNotify, initialSelectedUserId = null }) {
  const { user, isAdmin } = useAuth();
  const [items, setItems] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedUserFilter, setSelectedUserFilter] = useState(initialSelectedUserId || 'all');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeItem, setActiveItem] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Antibiotics',
    stock: 20,
    reorderLevel: 10,
    expiryDate: '2027-12-31',
    manufacturer: '',
    targetUserId: ''
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const inventoryPromise = api.getInventory(
        user,
        isAdmin && selectedUserFilter !== 'all' ? selectedUserFilter : null
      );
      const promises = [inventoryPromise];
      if (isAdmin) {
        promises.push(api.getUsers(user));
      }
      const [inventoryData, usersData] = await Promise.all(promises);
      setItems(inventoryData);
      if (usersData) {
        setUsersList(usersData);
      }
    } catch (err) {
      console.error('Error fetching catalog data:', err);
      if (onNotify) onNotify('Failed to load inventory: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, selectedUserFilter, onNotify]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = item.name.toLowerCase().includes(q);

      const matchCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchStatus = selectedStatus === 'All' || item.status === selectedStatus;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [items, search, selectedCategory, selectedStatus]);

  const openAddModal = () => {
    const clinicUsers = usersList.filter(u => u.role !== 'admin');
    if (isAdmin && clinicUsers.length === 0) {
      if (onNotify) onNotify('Cannot register medicines: No clinic user accounts exist yet. Administrative accounts cannot hold personal medicine records.', 'error');
      return;
    }

    const defaultTarget = isAdmin
      ? (selectedUserFilter !== 'all' && clinicUsers.some(u => u.id === selectedUserFilter) ? selectedUserFilter : clinicUsers[0]?.id || '')
      : (user ? user.id : '');

    setFormData({
      name: '',
      category: 'Antibiotics',
      stock: 25,
      reorderLevel: 10,
      expiryDate: '2027-12-31',
      manufacturer: 'Pfizer / Standard Pharma',
      targetUserId: defaultTarget
    });
    setIsAddModalOpen(true);
  };

  const openEditModal = (item) => {
    setActiveItem(item);
    setFormData({
      name: item.name,
      category: item.category || 'General',
      stock: item.stock,
      reorderLevel: item.reorderLevel,
      expiryDate: item.expiryDate || '',
      manufacturer: item.manufacturer || '',
      targetUserId: item.userId
    });
    setIsEditModalOpen(true);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    if (isAdmin) {
      const clinicUsers = usersList.filter(u => u.role !== 'admin');
      if (!formData.targetUserId || !clinicUsers.some(u => u.id === formData.targetUserId)) {
        if (onNotify) onNotify('Please select a valid clinic user account. Administrator accounts cannot store personal medicine records.', 'error');
        return;
      }
    }
    try {
      await api.createInventoryItem(user, formData);
      setIsAddModalOpen(false);
      loadData();
      if (onNotify) onNotify(`Medicine "${formData.name}" added to clinic catalog.`);
    } catch (err) {
      if (onNotify) onNotify('Error creating medicine: ' + err.message, 'error');
    }
  };

  const handleUpdateItem = async (e) => {
    e.preventDefault();
    if (!activeItem) return;
    try {
      await api.updateInventoryItem(user, activeItem.id, formData);
      setIsEditModalOpen(false);
      loadData();
      if (onNotify) onNotify(`Record for "${formData.name}" updated successfully.`);
    } catch (err) {
      if (onNotify) onNotify('Error updating medicine: ' + err.message, 'error');
    }
  };

  const handleDeleteItem = async (item) => {
    if (!window.confirm(`Are you sure you want to delete "${item.name}" from inventory?`)) {
      return;
    }
    try {
      await api.deleteInventoryItem(user, item.id);
      loadData();
      if (onNotify) onNotify(`Medicine "${item.name}" deleted from catalog.`);
    } catch (err) {
      if (onNotify) onNotify('Error deleting medicine: ' + err.message, 'error');
    }
  };

  const handleQuickAdjust = async (item, delta) => {
    const newStock = Math.max(0, (Number(item.stock) || 0) + delta);
    try {
      await api.updateInventoryItem(user, item.id, { stock: newStock });
      loadData();
      if (onNotify) onNotify(`Adjusted stock for ${item.name} to ${newStock} units.`);
    } catch (err) {
      if (onNotify) onNotify('Failed to update stock: ' + err.message, 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'In Stock': return <span className="badge badge-in-stock">In Stock</span>;
      case 'Low Stock': return <span className="badge badge-low-stock">Low Stock</span>;
      case 'Out of Stock': return <span className="badge badge-out-of-stock">Out of Stock</span>;
      default: return <span className="badge">{status}</span>;
    }
  };

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            Manage Medicine Catalog
          </h2>
          <p className="section-subtitle">
            {isAdmin ? 'System-wide Clinic Catalog Administration • Change and supervise user accounts and their medical records' : 'Add, edit, adjust stock, or remove medicines from your clinic catalog'}
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          Register New Medicine
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '1rem' }}
            placeholder="Search by medicine name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {isAdmin && (
            <select
              className="form-control"
              style={{ width: 'auto' }}
              value={selectedUserFilter}
              onChange={(e) => setSelectedUserFilter(e.target.value)}
            >
              <option value="all">All Clinic Accounts</option>
              {usersList.filter(u => u.role !== 'admin').map(u => (
                <option key={u.id} value={u.id}>
                  Clinic: {u.name} ({u.organization || u.email})
                </option>
              ))}
            </select>
          )}

          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {DEFAULT_CATEGORIES.map(cat => (
              <option key={cat} value={cat}>Category: {cat}</option>
            ))}
          </select>

          <select
            className="form-control"
            style={{ width: 'auto' }}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">Status: All</option>
            <option value="In Stock">In Stock</option>
            <option value="Low Stock">Low Stock</option>
            <option value="Out of Stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th>Medicine</th>
                <th>Category</th>
                <th>Quick Stock Adjust</th>
                <th>Expiry Date</th>
                <th>Status</th>
                {isAdmin && <th>Account Owner</th>}
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '2.5rem' }}>
                    Loading catalog records from database...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    No medicines match the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => {
                  const owner = usersList.find(u => u.id === item.userId);
                  const isExpired = item.expiryDate && new Date(item.expiryDate) < new Date();
                  const isExpiring = !isExpired && item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

                  return (
                    <tr key={item.id}>
                      <td>
                        <strong style={{ fontSize: '0.95rem', color: '#fff' }}>{item.name}</strong>
                        {item.manufacturer && (
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Mfg: {item.manufacturer}
                          </div>
                        )}
                      </td>

                      <td>
                        <span style={{
                          fontSize: '0.8rem',
                          background: 'rgba(255, 255, 255, 0.05)',
                          padding: '0.2rem 0.5rem',
                          borderRadius: '4px'
                        }}>
                          {item.category}
                        </span>
                      </td>

                      <td>
                        <div className="qty-stepper">
                          <button
                            className="qty-btn"
                            title="Dispense -1 unit"
                            onClick={() => handleQuickAdjust(item, -1)}
                          >
                            -
                          </button>
                          <span className="qty-display">{item.stock}</span>
                          <button
                            className="qty-btn"
                            title="Restock +1 unit"
                            onClick={() => handleQuickAdjust(item, +1)}
                          >
                            +
                          </button>
                        </div>
                      </td>

                      <td>
                        <span style={{
                          color: isExpired ? '#fb7185' : (isExpiring ? '#fbbf24' : 'inherit'),
                          fontWeight: isExpired ? 600 : 'normal'
                        }}>
                          {isoToDisplay(item.expiryDate)} {isExpired ? '(Expired)' : (isExpiring ? '(Expiring)' : '')}
                        </span>
                      </td>

                      <td>{getStatusBadge(item.status)}</td>

                      {isAdmin && (
                        <td>
                          <div style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'capitalize' }}>
                            {owner ? owner.name : item.userId}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                            {owner?.organization || 'Personal'}
                          </div>
                        </td>
                      )}

                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-outline btn-sm"
                            title="Edit Medicine Record"
                            onClick={() => openEditModal(item)}
                          >
                            Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            title="Delete Medicine Record"
                            onClick={() => handleDeleteItem(item)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Register New Medicine</h3>
              <button className="modal-close" onClick={() => setIsAddModalOpen(false)}>Close</button>
            </div>
            <form onSubmit={handleCreateItem}>
              <div className="modal-body">
                {isAdmin && (
                  <div className="form-group">
                    <label className="form-label">Assign To Clinic Account *</label>
                    <select
                      name="targetUserId"
                      required
                      className="form-control"
                      value={formData.targetUserId}
                      onChange={handleFormChange}
                    >
                      {usersList.filter(u => u.role !== 'admin').map(u => (
                        <option key={u.id} value={u.id}>
                          {u.name} — {u.organization || u.email}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Notice: Administrative accounts do not hold personal inventory. Medicines must belong to a clinic user account.
                    </span>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Medicine Generic / Brand Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Amoxicillin Trihydrate"
                    className="form-control"
                    value={formData.name}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      name="category"
                      className="form-control"
                      value={formData.category}
                      onChange={handleFormChange}
                    >
                      {DEFAULT_CATEGORIES.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <DateInput
                      name="expiryDate"
                      required
                      value={formData.expiryDate}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      required
                      className="form-control"
                      value={formData.stock}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manufacturer / Supplier</label>
                    <input
                      type="text"
                      name="manufacturer"
                      placeholder="Novartis, Pfizer, GSK"
                      className="form-control"
                      value={formData.manufacturer}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save to Catalog
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <div className="modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Medicine Record</h3>
              <button className="modal-close" onClick={() => setIsEditModalOpen(false)}>Close</button>
            </div>
            <form onSubmit={handleUpdateItem}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Medicine Generic / Brand Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    className="form-control"
                    value={formData.name}
                    onChange={handleFormChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      name="category"
                      className="form-control"
                      value={formData.category}
                      onChange={handleFormChange}
                    >
                      {DEFAULT_CATEGORIES.filter(c => c !== 'All').map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Expiry Date</label>
                    <DateInput
                      name="expiryDate"
                      required
                      value={formData.expiryDate}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      name="stock"
                      min="0"
                      required
                      className="form-control"
                      value={formData.stock}
                      onChange={handleFormChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Manufacturer / Supplier</label>
                    <input
                      type="text"
                      name="manufacturer"
                      className="form-control"
                      value={formData.manufacturer}
                      onChange={handleFormChange}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsEditModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
