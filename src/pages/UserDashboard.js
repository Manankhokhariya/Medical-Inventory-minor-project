import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import { isoToDisplay } from '../components/DateInput';
import {
  IconPill,
  IconBox,
  IconAlert,
  IconClock,
  IconLogs,
  IconArrowRight,
  IconCheck
} from '../components/Icons';

export default function UserDashboard({ setActivePage }) {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        setLoading(true);
        const [inventoryData, logsData] = await Promise.all([
          api.getInventory(user),
          api.getLogs(user)
        ]);
        setItems(inventoryData);
        setLogs(logsData.slice(0, 8));
      } catch (err) {
        console.error('Error loading dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <IconClock size={24} />
        </div>
        <h3>Loading Clinic Dashboard</h3>
        <p>Retrieving your facility's real-time medicine stock...</p>
      </div>
    );
  }

  const totalMedicines = items.length;
  const totalUnits = items.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
  const lowStockCount = items.filter(i => i.stock > 0 && i.stock <= i.reorderLevel).length;
  const outOfStockCount = items.filter(i => i.stock === 0).length;

  const now = new Date();
  const ninetyDaysFromNow = new Date();
  ninetyDaysFromNow.setDate(now.getDate() + 90);

  const expiringSoon = items.filter(item => {
    if (!item.expiryDate) return false;
    const exp = new Date(item.expiryDate);
    return exp >= now && exp <= ninetyDaysFromNow;
  });

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            Clinic Overview
          </h2>
          <p className="section-subtitle">
            <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{user?.organization || 'Medical Practice'}</span> • Dedicated Clinic Workspace
          </p>
        </div>
        <div className="section-actions">
          <button
            className="btn btn-primary"
            onClick={() => setActivePage('manage-catalog')}
          >
            <IconPill size={15} />
            Manage Full Catalog
          </button>
        </div>
      </div>

      <div className="grid-stats">
        <div className="card-stat">
          <div className="card-stat-header">
            <span className="card-stat-title">Catalog Medicines</span>
            <div className="card-stat-icon">
              <IconPill size={16} />
            </div>
          </div>
          <div className="card-stat-value">{totalMedicines}</div>
          <div className="card-stat-meta">Active unique formulas</div>
        </div>

        <div className="card-stat">
          <div className="card-stat-header">
            <span className="card-stat-title">Total Units Available</span>
            <div className="card-stat-icon">
              <IconBox size={16} />
            </div>
          </div>
          <div className="card-stat-value">{totalUnits.toLocaleString()}</div>
          <div className="card-stat-meta">Physical items in inventory</div>
        </div>

        <div className="card-stat">
          <div className="card-stat-header">
            <span className="card-stat-title">Low Stock Alerts</span>
            <div className="card-stat-icon" style={{ color: lowStockCount > 0 ? 'var(--amber)' : 'inherit' }}>
              <IconAlert size={16} />
            </div>
          </div>
          <div className="card-stat-value" style={{ color: lowStockCount > 0 ? 'var(--amber)' : 'inherit' }}>
            {lowStockCount}
          </div>
          <div className="card-stat-meta">At or under reorder point</div>
        </div>

        <div className="card-stat">
          <div className="card-stat-header">
            <span className="card-stat-title">Depleted Items</span>
            <div className="card-stat-icon" style={{ color: outOfStockCount > 0 ? 'var(--rose)' : 'inherit' }}>
              <IconAlert size={16} />
            </div>
          </div>
          <div className="card-stat-value" style={{ color: outOfStockCount > 0 ? 'var(--rose)' : 'inherit' }}>
            {outOfStockCount}
          </div>
          <div className="card-stat-meta">Zero inventory stock</div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* Alerts card */}
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Stock & Expiry Alerts
            </h3>
            <span className="badge badge-neutral">
              {expiringSoon.length + lowStockCount + outOfStockCount} items
            </span>
          </div>

          {expiringSoon.length === 0 && lowStockCount === 0 && outOfStockCount === 0 ? (
            <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
              <div className="empty-state-icon" style={{ color: 'var(--emerald)' }}>
                <IconCheck size={22} />
              </div>
              <strong style={{ color: '#fff' }}>All Stocks are Healthy</strong>
              <p style={{ fontSize: '0.84rem' }}>No medicines currently below minimum thresholds or expiring within 90 days.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {outOfStockCount > 0 && (
                <div className="alert-banner alert-banner-danger">
                  <div>
                    <strong style={{ display: 'block', color: '#fb7185' }}>Immediate Restock Required</strong>
                    <span style={{ fontSize: '0.78rem', opacity: 0.85 }}>{outOfStockCount} medicine(s) completely depleted</span>
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setActivePage('manage-catalog')}
                  >
                    Restock
                  </button>
                </div>
              )}

              {expiringSoon.map(med => (
                <div key={med.id} style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.75rem 0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: '#fff' }}>{med.name}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Expires: {isoToDisplay(med.expiryDate)} • Stock: {med.stock} units
                    </div>
                  </div>
                  <span className="badge badge-low-stock">
                    <span className="badge-dot" />
                    Expiring Soon
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Logs Card */}
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Recent Activity
            </h3>
            <span className="badge badge-neutral">
              <IconLogs size={12} />
              Audit Stream
            </span>
          </div>

          {logs.length === 0 ? (
            <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
              <div className="empty-state-icon">
                <IconLogs size={22} />
              </div>
              <strong style={{ color: '#fff' }}>No Activity Recorded</strong>
              <p style={{ fontSize: '0.84rem' }}>Stock updates and catalog changes will appear here.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              {logs.map(log => (
                <div key={log.id} style={{
                  padding: '0.75rem 0.9rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.25rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 600,
                      color: 'var(--primary-text)',
                      background: 'var(--primary-subtle)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {log.actionType}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {log.details}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
