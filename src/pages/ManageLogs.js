import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api';

export default function ManageLogs({ onNotify }) {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const [editingLog, setEditingLog] = useState(null);
  const [editFormData, setEditFormData] = useState({
    actionType: '',
    details: '',
    category: '',
    status: 'success'
  });

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getLogs(user);
      setLogs(data);
    } catch (err) {
      if (onNotify) onNotify('Error loading audit logs: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [user, onNotify]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const openEditModal = (log) => {
    setEditingLog(log);
    setEditFormData({
      actionType: log.actionType,
      details: log.details,
      category: log.category || 'General',
      status: log.status || 'success'
    });
  };

  const handleEditChange = (e) => {
    setEditFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSaveLog = async (e) => {
    e.preventDefault();
    if (!editingLog) return;
    try {
      await api.updateLog(user, editingLog.id, editFormData);
      setEditingLog(null);
      loadLogs();
      if (onNotify) onNotify('Audit log entry updated successfully.');
    } catch (err) {
      if (onNotify) onNotify('Failed to update log: ' + err.message, 'error');
    }
  };

  const handleDeleteLog = async (log) => {
    if (!window.confirm(`Are you sure you want to remove this log entry from ${log.userName}?`)) {
      return;
    }
    try {
      await api.deleteLog(user, log.id);
      loadLogs();
      if (onNotify) onNotify('Log entry deleted.');
    } catch (err) {
      if (onNotify) onNotify('Error deleting log: ' + err.message, 'error');
    }
  };

  const actionTypes = Array.from(new Set(logs.map(l => l.actionType))).filter(Boolean);

  const filteredLogs = logs.filter(log => {
    const q = search.toLowerCase();
    const matchSearch =
      log.details.toLowerCase().includes(q) ||
      (log.userName && log.userName.toLowerCase().includes(q)) ||
      (log.actionType && log.actionType.toLowerCase().includes(q));

    const matchAction = actionFilter === 'ALL' || log.actionType === actionFilter;
    return matchSearch && matchAction;
  });

  return (
    <div>
      <div className="section-header">
        <div>
          <h2 className="section-title">
            Manage System Audit Logs
          </h2>
          <p className="section-subtitle">
            System records updated by all users. Administrators can review, filter, and edit log entries.
          </p>
        </div>
        <button className="btn btn-outline" onClick={loadLogs}>
          Refresh Log Stream
        </button>
      </div>

      <div className="filter-bar">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            style={{ paddingLeft: '1rem' }}
            placeholder="Search logs by keyword, user, or details..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
        >
          <option value="ALL">All Action Types</option>
          {actionTypes.map(act => (
            <option key={act} value={act}>{act}</option>
          ))}
        </select>
      </div>

      <div className="table-card">
        <div className="table-responsive">
          <table className="app-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Author / User</th>
                <th>Action Type</th>
                <th>Audit Details & Updates</th>
                <th>Category</th>
                <th style={{ textAlign: 'right' }}>Admin Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem' }}>
                    Loading system audit records...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-secondary)' }}>
                    No audit logs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff' }}>
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                        {log.userName || 'System'}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        {log.userId}
                      </div>
                    </td>

                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--purple)',
                        background: 'rgba(168, 85, 247, 0.1)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid rgba(168, 85, 247, 0.2)'
                      }}>
                        {log.actionType}
                      </span>
                    </td>

                    <td style={{ maxWidth: '450px' }}>
                      <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {log.details}
                      </div>
                    </td>

                    <td>
                      <span style={{
                        fontSize: '0.78rem',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px'
                      }}>
                        {log.category || 'General'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          className="btn btn-outline btn-sm"
                          title="Edit this log record"
                          onClick={() => openEditModal(log)}
                        >
                          Edit Log
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          title="Delete log record"
                          onClick={() => handleDeleteLog(log)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingLog && (
        <div className="modal-overlay" onClick={() => setEditingLog(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Audit Log Entry</h3>
              <button className="modal-close" onClick={() => setEditingLog(null)}>Close</button>
            </div>
            <form onSubmit={handleSaveLog}>
              <div className="modal-body">
                <div style={{
                  background: 'rgba(255, 255, 255, 0.02)',
                  padding: '0.75rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)'
                }}>
                  Original Author: <strong>{editingLog.userName}</strong> ({editingLog.userId})<br />
                  Timestamp: {new Date(editingLog.timestamp).toLocaleString()}
                </div>

                <div className="form-group">
                  <label className="form-label">Action Classification Type</label>
                  <input
                    type="text"
                    name="actionType"
                    required
                    className="form-control"
                    value={editFormData.actionType}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Audit Log Details & Description</label>
                  <textarea
                    name="details"
                    rows="4"
                    required
                    className="form-control"
                    value={editFormData.details}
                    onChange={handleEditChange}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      name="category"
                      className="form-control"
                      value={editFormData.category}
                      onChange={handleEditChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Audit Status</label>
                    <select
                      name="status"
                      className="form-control"
                      value={editFormData.status}
                      onChange={handleEditChange}
                    >
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="info">Info</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setEditingLog(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Save Log Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
