import React, { useState, useEffect } from 'react';
import axios from '../utils/api';
import Layout from '../components/Layout';

const TABS = [
  { id: 'overview', icon: '📊', label: 'Overview' },
  { id: 'locations', icon: '📍', label: 'Manage Locations' },
  { id: 'bookings', icon: '📋', label: 'All Bookings' },
  { id: 'users', icon: '👥', label: 'Users' },
];

const ZONES = ['Park', 'Market', 'Riverside', 'Cultural', 'Square', 'Commercial'];
const AMENITIES_LIST = ['mic', 'stage', 'electricity', 'seating', 'lighting'];

export default function AdminDashboard() {
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [locations, setLocations] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locModal, setLocModal] = useState(null);
  const [locForm, setLocForm] = useState({ name: '', zone: 'Park', address: '', amenities: [], maxConcurrent: 1 });
  const [editingLoc, setEditingLoc] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchUser, setSearchUser] = useState('');

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [sRes, lRes, bRes, uRes] = await Promise.all([
        axios.get('/api/stats'),
        axios.get('/api/locations'),
        axios.get('/api/bookings'),
        axios.get('/api/users'),
      ]);
      setStats(sRes.data);
      setLocations(lRes.data);
      setBookings(bRes.data);
      setUsers(uRes.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const openAddLoc = () => {
    setLocForm({ name: '', zone: 'Park', address: '', amenities: [], maxConcurrent: 1 });
    setEditingLoc(null);
    setLocModal(true);
  };

  const openEditLoc = (loc) => {
    setLocForm({ name: loc.name, zone: loc.zone, address: loc.address, amenities: loc.amenities || [], maxConcurrent: loc.maxConcurrent });
    setEditingLoc(loc._id);
    setLocModal(true);
  };

  const saveLoc = async () => {
    if (editingLoc) {
      await axios.put(`/api/locations/${editingLoc}`, locForm);
    } else {
      await axios.post('/api/locations', locForm);
    }
    setLocModal(false);
    loadAll();
  };

  const deleteLoc = async (id) => {
    await axios.delete(`/api/locations/${id}`);
    setDeleteConfirm(null);
    loadAll();
  };

  const approve = async (id) => { await axios.put(`/api/bookings/${id}/approve`); loadAll(); };
  const reject = async (id) => { await axios.put(`/api/bookings/${id}/reject`, { reason: 'Rejected by admin' }); loadAll(); };

  const toggleAmenity = (a) => {
    setLocForm(f => ({
      ...f,
      amenities: f.amenities.includes(a) ? f.amenities.filter(x => x !== a) : [...f.amenities, a]
    }));
  };

  const statusBadge = (s) => <span className={`badge badge-${s}`}>{s}</span>;

  const filteredBookings = bookings.filter(b => !filterStatus || b.status === filterStatus);

  if (loading) return <Layout tabs={TABS} activeTab={tab} onTabChange={setTab}><div style={{ textAlign: 'center', padding: 60 }}><div className="spinner" style={{ margin: '0 auto' }}></div></div></Layout>;

  return (
    <Layout tabs={TABS} activeTab={tab} onTabChange={setTab}>

      {/* OVERVIEW */}
      {tab === 'overview' && stats && (
        <>
          <div className="page-header">
            <h1 className="page-title">Admin Overview</h1>
            <p className="page-subtitle">Platform-wide statistics and insights</p>
          </div>

          <div className="stats-grid">
            {[
              { label: 'Total Artists', value: stats.totalArtists, color: '', icon: '🎭' },
              { label: 'Locations', value: stats.totalLocations, color: 'blue', icon: '📍' },
              { label: 'Total Bookings', value: stats.totalBookings, color: '', icon: '📋' },
              { label: 'Pending', value: stats.pendingBookings, color: 'red', icon: '⏳' },
              { label: 'Approved', value: stats.approvedBookings, color: 'green', icon: '✅' },
              { label: 'Avg Rating', value: stats.avgRating + ' ⭐', color: '', icon: '⭐' },
            ].map(s => (
              <div key={s.label} className={`stat-card ${s.color}`}>
                <div className="stat-icon">{s.icon}</div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Booking Status Breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="card">
              <h3 style={{ fontFamily: 'Syne', marginBottom: 20, fontSize: 16 }}>Popular Locations</h3>
              {stats.popularLocations.map((loc, i) => (
                <div key={loc.name} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 20, color: 'var(--text-dim)', width: 24 }}>{i + 1}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{loc.name}</div>
                    <div style={{ height: 6, background: 'var(--dark3)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 3, width: `${Math.max(5, (loc.bookings / Math.max(stats.totalBookings, 1)) * 100)}%`, transition: 'width 0.4s' }} />
                    </div>
                  </div>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', minWidth: 40, textAlign: 'right' }}>{loc.bookings} bookings</span>
                </div>
              ))}
              {stats.popularLocations.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: 14 }}>No booking data yet</p>}
            </div>

            <div className="card">
              <h3 style={{ fontFamily: 'Syne', marginBottom: 20, fontSize: 16 }}>Status Breakdown</h3>
              {[
                { label: 'Pending', count: stats.pendingBookings, color: 'var(--warning)' },
                { label: 'Approved', count: stats.approvedBookings, color: 'var(--success)' },
                { label: 'Completed', count: stats.completedBookings, color: 'var(--info)' },
              ].map(s => (
                <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 14 }}>{s.label}</span>
                  <span style={{ fontFamily: 'Syne', fontWeight: 700, fontSize: 20 }}>{s.count}</span>
                </div>
              ))}
              <div style={{ marginTop: 16, height: 8, borderRadius: 4, overflow: 'hidden', display: 'flex', gap: 2 }}>
                {[
                  { color: 'var(--warning)', val: stats.pendingBookings },
                  { color: 'var(--success)', val: stats.approvedBookings },
                  { color: 'var(--info)', val: stats.completedBookings },
                ].map((s, i) => (
                  <div key={i} style={{ flex: s.val, background: s.color, minWidth: s.val > 0 ? 4 : 0 }} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* MANAGE LOCATIONS */}
      {tab === 'locations' && (
        <>
          <div className="page-header">
            <h1 className="page-title">Manage Locations</h1>
            <p className="page-subtitle">Add, edit or remove performance spots across the city</p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <button className="btn btn-primary" onClick={openAddLoc}>+ Add New Location</button>
          </div>

          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Name</th><th>Zone</th><th>Address</th><th>Amenities</th><th>Max</th><th>Status</th><th>Bookings</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {locations.map(loc => (
                  <tr key={loc._id}>
                    <td><strong>{loc.name}</strong></td>
                    <td><span style={{ color: 'var(--gold)', fontSize: 13 }}>{loc.zone}</span></td>
                    <td style={{ fontSize: 13, color: 'var(--text-muted)' }}>{loc.address}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {loc.amenities?.map(a => <span key={a} className="amenity-tag" style={{ fontSize: 11 }}>{a}</span>)}
                      </div>
                    </td>
                    <td style={{ textAlign: 'center' }}>{loc.maxConcurrent}</td>
                    <td>{statusBadge(loc.status)}</td>
                    <td style={{ textAlign: 'center' }}>{bookings.filter(b => b.locationId === loc._id).length}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEditLoc(loc)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => setDeleteConfirm(loc._id)}>Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ALL BOOKINGS */}
      {tab === 'bookings' && (
        <>
          <div className="page-header">
            <h1 className="page-title">All Bookings</h1>
            <p className="page-subtitle">Full booking management with approve/reject capabilities</p>
          </div>

          <div className="search-bar" style={{ marginBottom: 20 }}>
            <select className="form-select" style={{ width: 200 }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              {['pending', 'approved', 'rejected', 'completed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Artist</th><th>Location</th><th>Date</th><th>Time</th><th>Type</th><th>Status</th><th>Permit</th><th>Action</th>
              </tr></thead>
              <tbody>
                {filteredBookings.map(b => (
                  <tr key={b._id}>
                    <td><strong>{b.artist?.name}</strong></td>
                    <td>{b.location?.name}</td>
                    <td>{b.date}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{b.startTime}–{b.endTime}</td>
                    <td>{b.artType}</td>
                    <td>{statusBadge(b.status)}</td>
                    <td style={{ color: 'var(--gold)', fontFamily: 'monospace', fontSize: 12 }}>{b.permitNumber || '—'}</td>
                    <td>
                      {b.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-success btn-sm" onClick={() => approve(b._id)}>✓</button>
                          <button className="btn btn-danger btn-sm" onClick={() => reject(b._id)}>✕</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {filteredBookings.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-dim)' }}>No bookings found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* USERS */}
      {tab === 'users' && (
        <>
          <div className="page-header">
            <h1 className="page-title">Registered Users</h1>
            <p className="page-subtitle">All platform users by role</p>
          </div>

          <div className="search-bar">
            <input className="search-input" placeholder="Search users..."
              value={searchUser} onChange={e => setSearchUser(e.target.value)} />
          </div>

          <div className="table-wrapper">
            <table>
              <thead><tr>
                <th>Name</th><th>Email</th><th>Role</th><th>Genre/Type</th><th>Bookings</th>
              </tr></thead>
              <tbody>
                {users.filter(u => !searchUser || u.name.toLowerCase().includes(searchUser.toLowerCase()) || u.email.toLowerCase().includes(searchUser.toLowerCase())).map(u => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', background: u.role === 'admin' ? 'rgba(231,76,60,0.2)' : u.role === 'authority' ? 'rgba(52,152,219,0.2)' : 'rgba(232,168,50,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: u.role === 'admin' ? 'var(--danger)' : u.role === 'authority' ? 'var(--info)' : 'var(--gold)' }}>
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                        <strong>{u.name}</strong>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.email}</td>
                    <td><span className={`badge ${u.role === 'admin' ? 'badge-rejected' : u.role === 'authority' ? 'badge-completed' : 'badge-approved'}`}>{u.role}</span></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13 }}>{u.genre || '—'}</td>
                    <td style={{ textAlign: 'center' }}>{u.role === 'artist' ? bookings.filter(b => b.artistId === u._id).length : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ADD/EDIT LOCATION MODAL */}
      {locModal && (
        <div className="modal-overlay" onClick={() => setLocModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingLoc ? 'Edit Location' : 'Add New Location'}</h2>
              <button className="modal-close" onClick={() => setLocModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Location Name</label>
                <input className="form-input" placeholder="e.g. Central Park Stage"
                  value={locForm.name} onChange={e => setLocForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Zone</label>
                  <select className="form-select" value={locForm.zone} onChange={e => setLocForm(f => ({ ...f, zone: e.target.value }))}>
                    {ZONES.map(z => <option key={z}>{z}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Max Concurrent</label>
                  <input className="form-input" type="number" min="1" max="5"
                    value={locForm.maxConcurrent} onChange={e => setLocForm(f => ({ ...f, maxConcurrent: +e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" placeholder="Street address and zone"
                  value={locForm.address} onChange={e => setLocForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Amenities</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {AMENITIES_LIST.map(a => (
                    <button key={a} type="button"
                      className={`btn btn-sm ${locForm.amenities.includes(a) ? 'btn-primary' : 'btn-secondary'}`}
                      onClick={() => toggleAmenity(a)}>
                      {a === 'mic' ? '🎤' : a === 'stage' ? '🎭' : a === 'electricity' ? '⚡' : a === 'seating' ? '🪑' : '💡'} {a}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={saveLoc}>
                  {editingLoc ? 'Update Location' : 'Add Location'}
                </button>
                <button className="btn btn-secondary" onClick={() => setLocModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Delete Location?</h2>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 14 }}>This action cannot be undone. All bookings for this location will be affected.</p>
              <div style={{ display: 'flex', gap: 12 }}>
                <button className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }} onClick={() => deleteLoc(deleteConfirm)}>Yes, Delete</button>
                <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}