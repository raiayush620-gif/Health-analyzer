import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, KeyRound, AlertCircle, CheckCircle2, Award, Calendar, Activity } from 'lucide-react';

function Profile() {
  const { user, updateProfile, authFetch } = useAuth();
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [stats, setStats] = useState({
    avgSleep: 0,
    avgScreenTime: 0,
    avgWaterIntake: 0,
    avgStressLevel: 0,
    avgEnergyScore: 0,
    totalEntries: 0,
  });

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await authFetch('/api/records/data/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching statistics:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password && password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);
    try {
      await updateProfile(username, email, password || undefined);
      setSuccess('Profile updated successfully!');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page active">
      <div className="profile-container">
        <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Your Profile & Wellness Statistics</h2>
        
        <div className="profile-grid">
          {/* Account Profile Form */}
          <div className="card profile-card" style={{ margin: 0 }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#22f7ff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <User size={20} /> Account Details
            </h3>

            {error && (
              <div className="auth-message error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="auth-message success">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label htmlFor="username">Username</label>
                <div style={{ position: 'relative' }}>
                  <User size={14} style={{ position: 'absolute', left: '12px', top: '20px', color: '#888' }} />
                  <input
                    type="text"
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={14} style={{ position: 'absolute', left: '12px', top: '20px', color: '#888' }} />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ paddingLeft: '38px' }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="password">New Password (leave blank to keep current)</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={14} style={{ position: 'absolute', left: '12px', top: '20px', color: '#888' }} />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm New Password</label>
                <div style={{ position: 'relative' }}>
                  <KeyRound size={14} style={{ position: 'absolute', left: '12px', top: '20px', color: '#888' }} />
                  <input
                    type="password"
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? <span className="mini-spinner"></span> : 'Update Profile'}
              </button>
            </form>
          </div>

          {/* Wellness Statistics Panel */}
          <div className="card profile-card" style={{ margin: 0 }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#22f7ff', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Activity size={20} /> Lifetime Statistics
            </h3>

            {statsLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div className="spinner" style={{ width: '30px', height: '30px', margin: '0 auto 10px auto' }}></div>
                <p style={{ color: '#888' }}>Calculating stats...</p>
              </div>
            ) : (
              <div className="stats-grid">
                <div className="stat-box full-width">
                  <h4>Average Energy Score</h4>
                  <div className="stat-val" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Award size={28} style={{ color: '#ffcc33' }} /> {stats.avgEnergyScore}/100
                  </div>
                </div>

                <div className="stat-box">
                  <h4>Avg Sleep</h4>
                  <div className="stat-val">{stats.avgSleep} hrs</div>
                </div>

                <div className="stat-box">
                  <h4>Avg Screen Time</h4>
                  <div className="stat-val">{stats.avgScreenTime} hrs</div>
                </div>

                <div className="stat-box">
                  <h4>Avg Water</h4>
                  <div className="stat-val">{stats.avgWaterIntake} gl</div>
                </div>

                <div className="stat-box">
                  <h4>Avg Stress</h4>
                  <div className="stat-val">{stats.avgStressLevel}/10</div>
                </div>

                <div className="stat-box full-width" style={{ borderColor: 'rgba(255, 255, 255, 0.05)' }}>
                  <h4>Total Days Analyzed</h4>
                  <div className="stat-val" style={{ color: '#ccc', fontSize: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <Calendar size={18} /> {stats.totalEntries} Days
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default Profile;
