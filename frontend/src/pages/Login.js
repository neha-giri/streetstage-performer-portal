import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'authority') navigate('/authority');
      else navigate('/artist');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (e, pw) => { setEmail(e); setPassword(pw); };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-logo">🎭 StreetStage</div>
        <p className="auth-tagline">
          The official portal for city street performers.<br />
          Book your spot, get your permit, perform with confidence.
        </p>
        <div style={{ marginTop: 48 }}>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {[
              { icon: '📍', label: 'Reserve Spots', desc: 'Claim designated performance zones' },
              { icon: '📋', label: 'Get Permits', desc: 'Digital permits, instantly issued' },
              { icon: '⭐', label: 'Build Reputation', desc: 'Earn ratings from your audience' },
            ].map(f => (
              <div key={f.label} style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 600, fontFamily: 'Syne', marginBottom: 4 }}>{f.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-box">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Sign in to your performer account</p>

          {error && <div className="error-msg">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="••••••••"
                value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
              type="submit" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In →'}
            </button>
          </form>

          <div className="auth-divider">or</div>
          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)' }}>
            New artist? <Link to="/register" style={{ color: 'var(--gold)' }}>Create account</Link>
          </p>

          <div className="demo-credentials">
            <div className="demo-title">🔑 Demo Accounts</div>
            {[
              { label: 'Admin', email: 'admin@city.gov', pass: 'admin123' },
              { label: 'Authority', email: 'manager@city.gov', pass: 'manager123' },
              { label: 'Artist', email: 'rahul@artist.com', pass: 'rahul123' },
            ].map(d => (
              <div key={d.label} className="demo-item" style={{ cursor: 'pointer' }}
                onClick={() => quickLogin(d.email, d.pass)}>
                <span style={{ color: 'var(--gold)' }}>{d.label}</span>
                <code>{d.email} / {d.pass}</code>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
