import React, { useState, useEffect } from 'react';
import axios from '../utils/api';
import Layout from '../components/Layout';

const TABS = [
  { id: 'pending', icon: '⏳', label: 'Pending Requests' },
  { id: 'all', icon: '📋', label: 'All Bookings' },
  { id: 'locations', icon: '📍', label: 'Locations' },
];

export default function AuthorityDashboard() {
  const [tab, setTab] = useState('pending');
  const [bookings, setBookings] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [bRes, lRes] = await Promise.all([
        axios.get('/api/bookings'),
        axios.get('/api/locations'),
      ]);
      setBookings(bRes.data);
      setLocations(lRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const approve = async (id) => {
    await axios.put(`/api/bookings/${id}/approve`);
    loadData();
  };

  const reject = async () => {
    await axios.put(`/api/bookings/${rejectModal}/reject`, { reason: rejectReason });
    setRejectModal(null);
    setRejectReason('');
    loadData();
  };

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s}</span>;

  const pending = bookings.filter(b => b.status === 'pending');
  const filtered = bookings.filter(b =>
    (!filterStatus || b.status === filterStatus) &&
    (!searchTerm || b.artist?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.location?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) return <Layout tabs={TABS} activeTab={tab} onTabChange={setTab}><div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div></Layout>;

  return (
    <Layout tabs={TABS} activeTab={tab} onTabChange={setTab}>

      {/* PENDING */}
      {tab === 'pending' && (
        <>
          <div className="page-header">
            <h1 className="page-title">Pending Approval</h1>
            <p className="page-subtitle">{pending.length} requests awaiting your decision</p>
          </div>

          {pending.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <div className="empty-text">All clear! No pending booking requests.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {pending.map(b => (
                <div key={b._id} className="card" style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(232,168,50,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Syne', fontWeight: 700, fontSize: 16, color: 'var(--gold)' }}>
                        {b.artist?.name?.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 17 }}>{b.artist?.name}</div>
                        <div style={{ fontSize: 13, color: 'var(--gold)' }}>{b.artist?.genre} · {b.artType}</div>
                      </div>
                      <div style={{ marginLeft: 'auto' }}>{statusBadge(b.status)}</div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                      {[
                        { label: 'Location', value: b.location?.name },
                        { label: 'Zone', value: b.location?.zone },
                        { label: 'Date', value: b.date },
                        { label: 'Time', value: `${b.startTime} – ${b.endTime}` },
                      ].map(item => (
                        <div key={item.label} style={{ background: 'var(--dark3)', borderRadius: 8, padding: '10px 14px' }}>
                          <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>{item.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 500 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>

                    {b.description && (
                      <div style={{ marginTop: 12, fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                        "{b.description}"
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                    <button className="btn btn-success" onClick={() => approve(b._id)}>✓ Approve</button>
                    <button className="btn btn-danger" onClick={() => { setRejectModal(b._id); setRejectReason(''); }}>✕ Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ALL BOOKINGS */}
      {tab === 'all' && (
        <>
          <div className="page-header">
            <h1 className="page-title">All Bookings</h1>
            <p className="page-subtitle">Complete booking history across all locations</p>
          </div>

          <div className="search-bar">
            <input className="search-input" placeholder="Search by artist or location..."
              value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            <select className="form-select" style={{ width: 180 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {['pending', 'approved', 'rejected', 'completed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Artist</th><th>Location</th><th>Date</th><th>Time</th><th>Art Type</th><th>Status</th><th>Permit</th><th>Action</th>
              </tr></thead>
              <tbody>
                {filtered.map(b => (
                  <tr key={b._id}>
                    <td><strong>{b.artist?.name}</strong><br /><span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{b.artist?.genre}</span></td>
                    <td>{b.location?.name}</td>
                    <td>{b.date}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{b.startTime} – {b.endTime}</td>
                    <td>{b.artType}</td>
                    <td>{statusBadge(b.status)}</td>
                    <td>{b.permitNumber ? <span style={{ color: 'var(--gold)', fontFamily: 'monospace', fontSize: 13 }}>{b.permitNumber}</span> : '—'}</td>
                    <td>
                      {b.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success btn-sm" onClick={() => approve(b._id)}>✓</button>
                          <button className="btn btn-danger btn-sm" onClick={() => setRejectModal(b._id)}>✕</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', color: 'var(--text-dim)', padding: 32 }}>No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* LOCATIONS */}
      {tab === 'locations' && (
        <>
          <div className="page-header">
            <h1 className="page-title">Performance Locations</h1>
            <p className="page-subtitle">All registered performance spots in the city</p>
          </div>

          <div className="location-grid">
            {locations.map(loc => {
              const locBookings = bookings.filter(b => b.locationId === loc._id);
              const activeBookings = locBookings.filter(b => b.status === 'approved').length;
              return (
                <div key={loc._id} className="location-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                    <div className="location-name">{loc.name}</div>
                    <span className={`badge badge-${loc.status}`}>{loc.status}</span>
                  </div>
                  <div className="location-zone">{loc.zone}</div>
                  <div className="location-address">📍 {loc.address}</div>
                  <div style={{ marginBottom: 12 }}>
                    {loc.amenities?.map(a => (
                      <span key={a} className="amenity-tag">{a === 'mic' ? '🎤' : a === 'stage' ? '🎭' : '⚡'} {a}</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'var(--text-muted)' }}>Total bookings: <strong style={{ color: 'var(--text)' }}>{locBookings.length}</strong></span>
                    <span style={{ color: 'var(--success)' }}>Active: {activeBookings}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* REJECT MODAL */}
      {rejectModal && (
        <div className="modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Reject Booking</h2>
              <button className="modal-close" onClick={() => setRejectModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Reason for Rejection</label>
                <textarea className="form-textarea" placeholder="Provide a reason..."
                  value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={reject}>Confirm Reject</button>
                <button className="btn btn-secondary" onClick={() => setRejectModal(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}