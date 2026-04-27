import React, { useState, useEffect } from 'react';
import axios from '../utils/api';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const ART_TYPES = ['Music', 'Dance', 'Magic', 'Comedy', 'Acrobatics', 'Painting', 'Theater', 'Other'];

const TABS = [
  { id: 'dashboard', icon: '🏠', label: 'Dashboard' },
  { id: 'spots', icon: '📍', label: 'Browse Spots' },
  { id: 'book', icon: '➕', label: 'Book a Slot' },
  { id: 'bookings', icon: '📋', label: 'My Bookings' },
];

export default function ArtistDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('dashboard');
  const [locations, setLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bookForm, setBookForm] = useState({ locationId: '', date: '', startTime: '', endTime: '', artType: 'Music', description: '' });
  const [bookError, setBookError] = useState('');
  const [bookSuccess, setBookSuccess] = useState('');
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  const [filterZone, setFilterZone] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [locRes, bookRes] = await Promise.all([
        axios.get('/api/locations'),
        axios.get('/api/bookings/my')
      ]);
      setLocations(locRes.data);
      setBookings(bookRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleBook = async (e) => {
    e.preventDefault();
    setBookError(''); setBookSuccess('');
    try {
      await axios.post('/api/bookings', bookForm);
      setBookSuccess('Booking submitted! Awaiting authority approval.');
      setBookForm({ locationId: '', date: '', startTime: '', endTime: '', artType: 'Music', description: '' });
      loadData();
    } catch (err) {
      setBookError(err.response?.data?.error || 'Booking failed');
    }
  };

  const handleFeedback = async () => {
    try {
      await axios.post(`/api/feedback/${feedbackModal._id}`, feedback);
      setFeedbackModal(null);
      setFeedback({ rating: 0, comment: '' });
      alert('Feedback submitted!');
    } catch (e) { alert('Failed to submit feedback'); }
  };

  const markComplete = async (id) => {
    await axios.put(`/api/bookings/${id}/complete`);
    loadData();
  };

  const set = (k, v) => setBookForm(f => ({ ...f, [k]: v }));

  const pending = bookings.filter(b => b.status === 'pending').length;
  const approved = bookings.filter(b => b.status === 'approved').length;
  const completed = bookings.filter(b => b.status === 'completed').length;

  const zones = [...new Set(locations.map(l => l.zone))];
  const filteredLocs = locations.filter(l =>
    l.status === 'active' &&
    (!filterZone || l.zone === filterZone) &&
    (!searchTerm || l.name.toLowerCase().includes(searchTerm.toLowerCase()) || l.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s}</span>;

  if (loading) return (
    <Layout tabs={TABS} activeTab={tab} onTabChange={setTab}>
      <div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div>
    </Layout>
  );

  return (
    <Layout tabs={TABS} activeTab={tab} onTabChange={setTab}>

      {/* DASHBOARD */}
      {tab === 'dashboard' && (
        <>
          <div className="page-header">
            <h1 className="page-title">Welcome, {user.name} 🎭</h1>
            <p className="page-subtitle">Manage your street performances from one place</p>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-value">{pending}</div>
              <div className="stat-label">Pending Requests</div>
            </div>
            <div className="stat-card green">
              <div className="stat-icon">✅</div>
              <div className="stat-value">{approved}</div>
              <div className="stat-label">Approved</div>
            </div>
            <div className="stat-card blue">
              <div className="stat-icon">🎤</div>
              <div className="stat-value">{completed}</div>
              <div className="stat-label">Performances Done</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📍</div>
              <div className="stat-value">{locations.length}</div>
              <div className="stat-label">Available Spots</div>
            </div>
          </div>

          {/* Recent Bookings */}
          <div className="section">
            <div className="section-header">
              <h2 className="section-title">Recent Activity</h2>
              <button className="btn btn-secondary btn-sm" onClick={() => setTab('bookings')}>View All</button>
            </div>
            <div className="table-wrapper">
              <table>
                <thead><tr>
                  <th>Location</th><th>Date</th><th>Time</th><th>Art Type</th><th>Status</th><th>Permit</th>
                </tr></thead>
                <tbody>
                  {bookings.slice(0, 5).map(b => (
                    <tr key={b._id}>
                      <td><strong>{b.location?.name}</strong></td>
                      <td>{b.date}</td>
                      <td>{b.startTime} – {b.endTime}</td>
                      <td>{b.artType}</td>
                      <td>{statusBadge(b.status)}</td>
                      <td>{b.permitNumber ? <span className="permit-card" style={{ padding: '4px 10px', display: 'inline-flex' }}>
                        <span className="permit-number" style={{ fontSize: 13 }}>{b.permitNumber}</span>
                      </span> : <span style={{ color: 'var(--text-dim)' }}>—</span>}</td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32 }}>No bookings yet. Book your first slot!</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Profile Card */}
          {user.genre && (
            <div className="section">
              <h2 className="section-title" style={{ marginBottom: 16 }}>Your Profile</h2>
              <div className="card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontSize: 22, fontWeight: 800, color: 'var(--black)', flexShrink: 0 }}>
                  {user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontFamily: 'Syne', fontSize: 20, fontWeight: 700 }}>{user.name}</div>
                  <div style={{ color: 'var(--gold)', fontSize: 13, margin: '4px 0' }}>{user.genre} Performer</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>{user.bio || 'No bio added yet'}</div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* BROWSE SPOTS */}
      {tab === 'spots' && (
        <>
          <div className="page-header">
            <h1 className="page-title">Browse Performance Spots</h1>
            <p className="page-subtitle">Find the perfect location for your act</p>
          </div>

          <div className="search-bar">
            <input className="search-input" placeholder="Search by name or address..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <select className="form-select" style={{ width: 160 }} value={filterZone} onChange={e => setFilterZone(e.target.value)}>
              <option value="">All Zones</option>
              {zones.map(z => <option key={z}>{z}</option>)}
            </select>
          </div>

          <div className="location-grid">
            {filteredLocs.map(loc => (
              <div key={loc._id} className="location-card" onClick={() => { setBookForm(f => ({ ...f, locationId: loc._id })); setTab('book'); }}>
                <div className="location-name">{loc.name}</div>
                <div className="location-zone">{loc.zone}</div>
                <div className="location-address">📍 {loc.address}</div>
                <div style={{ marginBottom: 12 }}>
                  {loc.amenities?.map(a => (
                    <span key={a} className="amenity-tag">
                      {a === 'mic' ? '🎤' : a === 'stage' ? '🎭' : a === 'electricity' ? '⚡' : '✦'} {a}
                    </span>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="badge badge-active">Available</span>
                  <span style={{ fontSize: 12, color: 'var(--gold)' }}>Book this spot →</span>
                </div>
              </div>
            ))}
            {filteredLocs.length === 0 && (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <div className="empty-icon">🔍</div>
                <div className="empty-text">No spots found matching your search</div>
              </div>
            )}
          </div>
        </>
      )}

      {/* BOOK A SLOT */}
      {tab === 'book' && (
        <>
          <div className="page-header">
            <h1 className="page-title">Book a Performance Slot</h1>
            <p className="page-subtitle">Submit your booking request for authority approval</p>
          </div>

          <div className="card" style={{ maxWidth: 560 }}>
            {bookError && <div className="error-msg">⚠ {bookError}</div>}
            {bookSuccess && <div style={{ background: 'rgba(46,204,113,0.1)', border: '1px solid rgba(46,204,113,0.3)', color: 'var(--success)', padding: '10px 14px', borderRadius: 8, marginBottom: 16, fontSize: 13 }}>✅ {bookSuccess}</div>}

            <form onSubmit={handleBook}>
              <div className="form-group">
                <label className="form-label">Performance Location</label>
                <select className="form-select" value={bookForm.locationId} onChange={e => set('locationId', e.target.value)} required>
                  <option value="">Select a spot...</option>
                  {locations.filter(l => l.status === 'active').map(l => (
                    <option key={l._id} value={l._id}>{l.name} — {l.zone}</option>
                  ))}
                </select>
              </div>

              {bookForm.locationId && (
                <div style={{ background: 'var(--dark3)', borderRadius: 8, padding: 12, marginBottom: 16, fontSize: 13 }}>
                  {(() => {
                    const l = locations.find(x => x._id === bookForm.locationId);
                    return l ? <><strong style={{ color: 'var(--gold)' }}>{l.name}</strong> · {l.zone} · 📍 {l.address}</> : null;
                  })()}
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={bookForm.date}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => set('date', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input className="form-input" type="time" value={bookForm.startTime}
                    onChange={e => set('startTime', e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input className="form-input" type="time" value={bookForm.endTime}
                    onChange={e => set('endTime', e.target.value)} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Art Type</label>
                <select className="form-select" value={bookForm.artType} onChange={e => set('artType', e.target.value)}>
                  {ART_TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Performance Description</label>
                <textarea className="form-textarea" placeholder="Describe your performance act..."
                  value={bookForm.description} onChange={e => set('description', e.target.value)} />
              </div>

              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} type="submit">
                Submit Booking Request →
              </button>
            </form>
          </div>
        </>
      )}

      {/* MY BOOKINGS */}
      {tab === 'bookings' && (
        <>
          <div className="page-header">
            <h1 className="page-title">My Bookings</h1>
            <p className="page-subtitle">Track all your performance requests and permits</p>
          </div>

          {['pending', 'approved', 'completed', 'rejected'].map(status => {
            const items = bookings.filter(b => b.status === status);
            if (items.length === 0) return null;
            return (
              <div key={status} className="section">
                <div className="section-header">
                  <h2 className="section-title" style={{ textTransform: 'capitalize' }}>{status} ({items.length})</h2>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead><tr>
                      <th>Location</th><th>Date</th><th>Time</th><th>Art Type</th><th>Status</th><th>Permit</th><th>Action</th>
                    </tr></thead>
                    <tbody>
                      {items.map(b => (
                        <tr key={b._id}>
                          <td><strong>{b.location?.name}</strong><br /><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.location?.zone}</span></td>
                          <td>{b.date}</td>
                          <td>{b.startTime} – {b.endTime}</td>
                          <td>{b.artType}</td>
                          <td>{statusBadge(b.status)}</td>
                          <td>
                            {b.permitNumber
                              ? <div className="permit-card"><span className="permit-number" style={{ fontSize: 13 }}>{b.permitNumber}</span></div>
                              : <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>—</span>}
                          </td>
                          <td>
                            {b.status === 'approved' && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-success btn-sm" onClick={() => markComplete(b._id)}>✓ Complete</button>
                                <button className="btn btn-secondary btn-sm" onClick={() => setFeedbackModal(b)}>⭐ Rate</button>
                              </div>
                            )}
                            {b.status === 'rejected' && b.rejectionReason && (
                              <span style={{ fontSize: 12, color: 'var(--danger)' }}>{b.rejectionReason}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {bookings.length === 0 && (
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <div className="empty-text">No bookings yet. Book your first performance slot!</div>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setTab('book')}>Book a Slot</button>
            </div>
          )}
        </>
      )}

      {/* FEEDBACK MODAL */}
      {feedbackModal && (
        <div className="modal-overlay" onClick={() => setFeedbackModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Rate Your Performance</h2>
              <button className="modal-close" onClick={() => setFeedbackModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>
                {feedbackModal.location?.name} · {feedbackModal.date}
              </p>
              <div className="form-group">
                <label className="form-label">Crowd Rating</label>
                <div className="stars">
                  {[1, 2, 3, 4, 5].map(s => (
                    <span key={s} className="star" style={{ color: s <= feedback.rating ? '#E8A832' : 'var(--text-dim)' }}
                      onClick={() => setFeedback(f => ({ ...f, rating: s }))}>★</span>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Comments</label>
                <textarea className="form-textarea" placeholder="How was the crowd response?"
                  value={feedback.comment} onChange={e => setFeedback(f => ({ ...f, comment: e.target.value }))} />
              </div>
              <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleFeedback} disabled={!feedback.rating}>Submit Feedback</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}