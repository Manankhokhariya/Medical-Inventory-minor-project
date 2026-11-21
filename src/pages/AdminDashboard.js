import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';
import {
  IconUsers,
  IconBox,
  IconCheck,
  IconAlert,
  IconShield,
  IconLogs,
  IconClock,
  IconArrowRight
} from '../components/Icons';

export default function AdminDashboard({ setActivePage }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [items, setItems] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAdminData() {
      try {
        setLoading(true);
        const [usersData, itemsData, logsData] = await Promise.all([
          api.getUsers(user),
          api.getInventory(user),
          api.getLogs(user)
        ]);
        setUsers(usersData);
        setItems(itemsData);
        setLogs(logsData.slice(0, 8));
      } catch (err) {
        console.error('Error fetching admin dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAdminData();
  }, [user]);

  if (loading) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">
          <IconClock size={24} />
        </div>
        <h3>Loading System Overview</h3>
        <p>Gathering metrics across all healthcare nodes...</p>
      </div>
    );
  }

  const totalMedicines = items.length;
  const totalUnits = items.reduce((acc, curr) => acc + (Number(curr.stock) || 0), 0);
  const lowStockCount = items.filter(i => i.stock > 0 && i.stock <= i.reorderLevel).length;
  const outOfStockCount = items.filter(i => i.stock === 0).length;
  const healthyStockCount = items.filter(i => i.stock > i.reorderLevel).length;

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            Administrator Console
          </h2>
          <p className="section-subtitle">
            Global healthcare node monitoring • Supervise clinic accounts, catalogs, and security logs
          </p>
        </div>
        <div className="section-actions">
          <button className="btn btn-outline" onClick={() => setActivePage('manage-users')}>
            <IconUsers size={15} />
            Manage Accounts ({users.length})
          </button>
          <button className="btn btn-primary" onClick={() => setActivePage('manage-logs')}>
            <IconLogs size={15} />
            System Audit Trail
          </button>
        </div>
      </div>

      <div className="grid-stats">
        <div className="card-stat">
          <div className="card-stat-header">
            <span className="card-stat-title">Registered Accounts</span>
            <div className="card-stat-icon">
              <IconUsers size={16} />
            </div>
          </div>
          <div className="card-stat-value">{users.length}</div>
          <div className="card-stat-meta">Active medical organizations</div>
        </div>

        <div className="card-stat">
          <div className="card-stat-header">
            <span className="card-stat-title">Network Medicines</span>
            <div className="card-stat-icon">
              <IconBox size={16} />
            </div>
          </div>
          <div className="card-stat-value">{totalMedicines}</div>
          <div className="card-stat-meta">{totalUnits.toLocaleString()} units tracked</div>
        </div>

        <div className="card-stat">
          <div className="card-stat-header">
            <span className="card-stat-title">Healthy Inventory</span>
            <div className="card-stat-icon" style={{ color: 'var(--emerald)' }}>
              <IconCheck size={16} />
            </div>
          </div>
          <div className="card-stat-value">{healthyStockCount}</div>
          <div className="card-stat-meta">Above reorder safety levels</div>
        </div>

        <div className="card-stat">
          <div className="card-stat-header">
            <span className="card-stat-title">Stockout Alerts</span>
            <div className="card-stat-icon" style={{ color: (lowStockCount + outOfStockCount) > 0 ? 'var(--amber)' : 'inherit' }}>
              <IconAlert size={16} />
            </div>
          </div>
          <div className="card-stat-value" style={{ color: (lowStockCount + outOfStockCount) > 0 ? 'var(--amber)' : 'inherit' }}>
            {lowStockCount + outOfStockCount}
          </div>
          <div className="card-stat-meta">{outOfStockCount} out of stock, {lowStockCount} low</div>
        </div>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
        gap: '1.5rem'
      }}>
        {/* User Accounts */}
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              Clinic User Accounts
            </h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setActivePage('manage-users')}
            >
              View All <IconArrowRight size={13} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {users.map(u => (
              <div key={u.id} style={{
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                padding: '0.8rem 1rem',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div className="user-avatar" style={{ width: '28px', height: '28px', fontSize: '0.75rem' }}>
                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#fff' }}>{u.name}</div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      {u.organization || 'Independent'} • {u.email}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span className={`role-badge ${u.role}`}>
                    {u.role === 'admin' ? 'Admin' : 'Clinic'}
                  </span>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {u.itemCount || 0} items
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Global Audit Logs */}
        <div className="table-card" style={{ padding: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#fff' }}>
              System Audit Stream
            </h3>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setActivePage('manage-logs')}
            >
              Audit Explorer <IconArrowRight size={13} />
            </button>
          </div>

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
                  <div style={{ display: 'flex', gap: '0.45rem', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 600,
                      color: '#c084fc',
                      background: 'var(--purple-subtle)',
                      padding: '0.12rem 0.45rem',
                      borderRadius: 'var(--radius-full)'
                    }}>
                      {log.actionType}
                    </span>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.userName}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  {log.details}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
