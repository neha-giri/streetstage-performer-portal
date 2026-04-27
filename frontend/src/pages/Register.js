import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const GENRES = ['Music', 'Dance', 'Magic', 'Comedy', 'Acrobatics', 'Painting', 'Theater', 'Other'];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', genre: 'Music', bio: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register({ ...form, role: 'artist' });
      navigate('/artist');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-logo">🎭 StreetStage</div>
        <p className="auth-tagline">
          Join hundreds of street performers who use StreetStage to manage their city performances legally and professionally.
        </p>
        <div style={{ marginTop: 40, background: 'var(--dark3)', borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.8 }}>
            ✅ Free to register<br />
            ✅ Instant permit on approval<br />
            ✅ No scheduling conflicts<br />
            ✅ Build your performer profile<br />
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-form-box">
          <h1 className="auth-title">Join as Artist</h1>
          <p className="auth-sub">Create your performer account</p>

          {error && <div className="error-msg">⚠ {error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input className="form-input" placeholder="Your stage name"
                value={form.name} onChange={e => set('name', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" type="email" placeholder="you@example.com"
                value={form.email} onChange={e => set('email', e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input className="form-input" type="password" placeholder="Min 6 characters"
                value={form.password} onChange={e => set('password', e.target.value)} required minLength={6} />
            </div>
            <div className="form-group">
              <label className="form-label">Art Genre</label>
              <select className="form-select" value={form.genre} onChange={e => set('genre', e.target.value)}>
                {GENRES.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Bio (optional)</label>
              <textarea className="form-textarea" placeholder="Tell the city about your act..."
                value={form.bio} onChange={e => set('bio', e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
              type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--text-muted)', marginTop: 20 }}>
            Already have an account? <Link to="/login" style={{ color: 'var(--gold)' }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
