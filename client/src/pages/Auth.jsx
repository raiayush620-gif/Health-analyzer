import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KeyRound, Mail, User, AlertCircle, CheckCircle2 } from 'lucide-react';

function Auth({ setActivePage }) {
  const { login, register } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (isRegistering) {
        await register(username, email, password);
        setSuccess('Registration successful! Redirecting...');
        setTimeout(() => {
          setActivePage('analysis');
        }, 1500);
      } else {
        await login(email, password);
        setSuccess('Login successful! Welcome back.');
        setTimeout(() => {
          setActivePage('analysis');
        }, 1200);
      }
    } catch (err) {
      setError(err.message || 'An error occurred during authentication');
      setLoading(false);
    }
  };

  return (
    <section className="page active">
      <div className="card" style={{ marginTop: '50px' }}>
        <div className="auth-toggle">
          <button
            type="button"
            className={!isRegistering ? 'active' : ''}
            onClick={() => {
              setIsRegistering(false);
              setError('');
              setSuccess('');
            }}
          >
            Login
          </button>
          <button
            type="button"
            className={isRegistering ? 'active' : ''}
            onClick={() => {
              setIsRegistering(true);
              setError('');
              setSuccess('');
            }}
          >
            Register
          </button>
        </div>

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

        <form onSubmit={handleSubmit}>
          {isRegistering && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '20px', color: '#888' }} />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ayush_rai"
                  style={{ paddingLeft: '38px' }}
                  required={isRegistering}
                />
              </div>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email or Username</label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '20px', color: '#888' }} />
              <input
                type="text"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRegistering ? "e.g. ayush@example.com" : "Email or Username"}
                style={{ paddingLeft: '38px' }}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <div style={{ position: 'relative' }}>
              <KeyRound size={16} style={{ position: 'absolute', left: '12px', top: '20px', color: '#888' }} />
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                style={{ paddingLeft: '38px' }}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="mini-spinner"></span> Processing...
              </>
            ) : isRegistering ? (
              'Create Account'
            ) : (
              'Sign In'
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Auth;
