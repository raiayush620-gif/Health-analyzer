import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, LayoutDashboard, Shield, ShieldAlert, Trash2, Activity, ShieldCheck, Mail, Calendar } from 'lucide-react';

function AdminDashboard() {
  const { authFetch, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      // 1. Fetch system statistics
      const statsRes = await authFetch('/api/admin/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        throw new Error('Failed to retrieve system statistics');
      }

      // 2. Fetch users list
      const usersRes = await authFetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(usersData);
      } else {
        throw new Error('Failed to retrieve user accounts');
      }
    } catch (err) {
      setError(err.message || 'Error fetching administrator dashboard details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRoleToggle = async (userId, currentRole) => {
    setError('');
    setSuccess('');
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    
    if (userId === currentUser._id) {
      return setError('You cannot modify your own administrative permissions.');
    }

    if (!window.confirm(`Are you sure you want to change this user's role to ${newRole.toUpperCase()}?`)) return;

    try {
      const res = await authFetch(`/api/admin/users/${userId}/role`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(`User role updated to ${newRole} successfully!`);
        setUsers(users.map(u => u._id === userId ? { ...u, role: newRole } : u));
        fetchAdminData(); // Refresh global stats
      } else {
        setError(data.message || 'Failed to update user role');
      }
    } catch (err) {
      console.error(err);
      setError('Server error while toggling user role');
    }
  };

  const handleDeleteUser = async (userId, username) => {
    setError('');
    setSuccess('');

    if (userId === currentUser._id) {
      return setError('You cannot delete your own account.');
    }

    if (!window.confirm(`WARNING: Are you sure you want to delete user "${username}" and all of their daily energy records? This action cannot be undone.`)) return;

    try {
      const res = await authFetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(`User "${username}" and their historical logs have been removed.`);
        setUsers(users.filter(u => u._id !== userId));
        fetchAdminData(); // Refresh global stats
      } else {
        setError(data.message || 'Failed to delete user');
      }
    } catch (err) {
      console.error(err);
      setError('Server error deleting user');
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p className="loading-text">Loading administrator dashboard...</p>
      </div>
    );
  }

  return (
    <section className="page active">
      <div className="admin-container">
        <h2 style={{ textAlign: 'center', marginBottom: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <LayoutDashboard size={26} style={{ color: '#22f7ff' }} /> Administrator Dashboard
        </h2>

        {error && (
          <div className="auth-message error" style={{ maxWidth: 'none', marginBottom: '20px' }}>
            <ShieldAlert size={16} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="auth-message success" style={{ maxWidth: 'none', marginBottom: '20px' }}>
            <ShieldCheck size={16} />
            <span>{success}</span>
          </div>
        )}

        {/* Global Statistics Cards */}
        {stats && (
          <div className="admin-stats-bar">
            <div className="admin-stat-card">
              <h4>Total Users</h4>
              <div className="admin-stat-num">{stats.totalUsers}</div>
            </div>
            <div className="admin-stat-card">
              <h4>Total Log Entries</h4>
              <div className="admin-stat-num">{stats.totalRecords}</div>
            </div>
            <div className="admin-stat-card">
              <h4>Avg Score</h4>
              <div className="admin-stat-num" style={{ color: '#ffcc33' }}>{stats.avgEnergyScore}/100</div>
            </div>
            <div className="admin-stat-card">
              <h4>Avg Sleep</h4>
              <div className="admin-stat-num" style={{ color: '#4dff88' }}>{stats.avgSleep}h</div>
            </div>
            <div className="admin-stat-card">
              <h4>Avg Screen</h4>
              <div className="admin-stat-num" style={{ color: '#ff4d4d' }}>{stats.avgScreenTime}h</div>
            </div>
            <div className="admin-stat-card">
              <h4>Avg Stress</h4>
              <div className="admin-stat-num" style={{ color: '#b09eff' }}>{stats.avgStressLevel}/10</div>
            </div>
          </div>
        )}

        {/* Users list table */}
        <h3 style={{ fontSize: '18px', color: '#22f7ff', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Users size={18} /> User Account Directory
        </h3>

        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>Joined Date</th>
                <th>Access Level</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} style={u._id === currentUser._id ? { background: 'rgba(34, 247, 255, 0.03)' } : {}}>
                  <td style={{ fontWeight: 600 }}>
                    {u.username} {u._id === currentUser._id && <span style={{ fontSize: '11px', color: '#22f7ff', fontStyle: 'italic' }}>(You)</span>}
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={12} style={{ opacity: 0.5 }} /> {u.email}
                    </span>
                  </td>
                  <td>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={12} style={{ opacity: 0.5 }} /> {new Date(u.createdAt).toLocaleDateString()}
                    </span>
                  </td>
                  <td>
                    <span className={`user-badge ${u.role}`}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => handleRoleToggle(u._id, u.role)}
                        disabled={u._id === currentUser._id}
                        title={u.role === 'admin' ? "Demote to User" : "Promote to Admin"}
                        style={{ padding: '6px 10px', fontSize: '11px' }}
                      >
                        <Shield size={11} /> Role
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => handleDeleteUser(u._id, u.username)}
                        disabled={u._id === currentUser._id}
                        title="Delete User"
                        style={{ padding: '6px' }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default AdminDashboard;
