require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const Location = require('./models/Location');
const Booking = require('./models/Booking');
const Feedback = require('./models/Feedback');

const app = express();
app.use(cors());
app.use(express.json());

// ─── DB Connection ─────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Booking Service: MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// Seed sample locations
async function seedLocations() {
  const count = await Location.countDocuments();
  if (count > 0) return;
  await Location.insertMany([
    { name: 'Central Park Stage', zone: 'Park', address: 'MG Road, Zone A', amenities: ['mic', 'stage', 'electricity'], maxConcurrent: 1 },
    { name: 'Market Square', zone: 'Market', address: 'Old Market, Zone B', amenities: ['electricity'], maxConcurrent: 2 },
    { name: 'Riverside Promenade', zone: 'Riverside', address: 'River Road, Zone C', amenities: ['stage'], maxConcurrent: 1 },
    { name: 'Art District Corner', zone: 'Cultural', address: 'Artists Lane, Zone D', amenities: ['mic', 'electricity'], maxConcurrent: 1 },
  ]);
  console.log('  Seeded locations');
}
mongoose.connection.once('open', seedLocations);

// ─── Auth Middleware ────────────────────────────────────────
const auth = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ error: `Access denied. Required role: ${roles.join(' or ')}` });
  next();
};

// ─── Permit Generator ──────────────────────────────────────
const genPermit = () => 'PERMIT-' + Date.now().toString(36).toUpperCase().slice(-6);

// ─── Conflict Checker ──────────────────────────────────────
async function hasConflict(locationId, date, startTime, endTime, excludeId = null) {
  const query = {
    locationId,
    date,
    status: { $in: ['pending', 'approved'] }
  };
  if (excludeId) query._id = { $ne: excludeId };
  const existing = await Booking.find(query);
  return existing.some(b => !(endTime <= b.startTime || startTime >= b.endTime));
}

// ─── HEALTH ────────────────────────────────────────────────
app.get('/health', (req, res) =>
  res.json({ status: 'Booking Service OK', time: new Date() })
);

// ══════════════════════════════════════════════════════════
// LOCATION ROUTES
// ══════════════════════════════════════════════════════════

// GET /locations
app.get('/locations', auth, async (req, res) => {
  try {
    const { zone, status, search } = req.query;
    const filter = {};
    if (zone) filter.zone = zone;
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };
    const locations = await Location.find(filter).sort({ createdAt: -1 });
    res.json(locations);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /locations/:id
app.get('/locations/:id', auth, async (req, res) => {
  try {
    const loc = await Location.findById(req.params.id);
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    res.json(loc);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /locations  — admin only
app.post('/locations', auth, requireRole('admin'), async (req, res) => {
  try {
    const loc = await Location.create({ ...req.body, createdBy: req.user.id });
    res.status(201).json(loc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// PUT /locations/:id  — admin only
app.put('/locations/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    const loc = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!loc) return res.status(404).json({ error: 'Location not found' });
    res.json(loc);
  } catch (err) { res.status(400).json({ error: err.message }); }
});

// DELETE /locations/:id  — admin only
app.delete('/locations/:id', auth, requireRole('admin'), async (req, res) => {
  try {
    await Location.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Location deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════
// BOOKING ROUTES
// ══════════════════════════════════════════════════════════

// POST /bookings  — artist only
app.post('/bookings', auth, requireRole('artist'), async (req, res) => {
  try {
    const { locationId, date, startTime, endTime, artType, description } = req.body;
    if (!locationId || !date || !startTime || !endTime || !artType)
      return res.status(400).json({ error: 'All fields required' });
    if (startTime >= endTime)
      return res.status(400).json({ error: 'End time must be after start time' });

    const loc = await Location.findById(locationId);
    if (!loc || loc.status === 'inactive')
      return res.status(400).json({ error: 'Location not available' });

    if (await hasConflict(locationId, date, startTime, endTime))
      return res.status(409).json({ error: 'This time slot is already booked at that location' });

    const booking = await Booking.create({
      artistId: req.user.id,
      artistName: req.user.name,
      artistGenre: req.user.genre,
      locationId, date, startTime, endTime, artType, description
    });
    await booking.populate('locationId');
    res.status(201).json(booking);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /bookings/my  — artist's own bookings
app.get('/bookings/my', auth, requireRole('artist'), async (req, res) => {
  try {
    const { status } = req.query;
    const filter = { artistId: req.user.id };
    if (status) filter.status = status;
    const bookings = await Booking.find(filter).populate('locationId').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /bookings  — authority/admin
app.get('/bookings', auth, requireRole('authority', 'admin'), async (req, res) => {
  try {
    const { status, date, locationId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (date) filter.date = date;
    if (locationId) filter.locationId = locationId;
    const bookings = await Booking.find(filter).populate('locationId').sort({ createdAt: -1 });
    res.json(bookings);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /bookings/:id/approve
app.put('/bookings/:id/approve', auth, requireRole('authority', 'admin'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'pending')
      return res.status(400).json({ error: 'Only pending bookings can be approved' });

    booking.status = 'approved';
    booking.permitNumber = genPermit();
    booking.approvedBy = req.user.id;
    booking.approvedAt = new Date();
    await booking.save();
    await booking.populate('locationId');
    res.json(booking);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /bookings/:id/reject
app.put('/bookings/:id/reject', auth, requireRole('authority', 'admin'), async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.status !== 'pending')
      return res.status(400).json({ error: 'Only pending bookings can be rejected' });

    booking.status = 'rejected';
    booking.rejectionReason = req.body.reason || 'Not specified';
    await booking.save();
    await booking.populate('locationId');
    res.json(booking);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// PUT /bookings/:id/complete
app.put('/bookings/:id/complete', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    if (booking.artistId !== req.user.id && !['admin', 'authority'].includes(req.user.role))
      return res.status(403).json({ error: 'Not authorized' });
    if (booking.status !== 'approved')
      return res.status(400).json({ error: 'Only approved bookings can be completed' });

    booking.status = 'completed';
    await booking.save();
    await booking.populate('locationId');
    res.json(booking);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════
// FEEDBACK ROUTES
// ══════════════════════════════════════════════════════════

// POST /feedback/:bookingId
app.post('/feedback/:bookingId', auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });
    const fb = await Feedback.create({
      bookingId: booking._id,
      locationId: booking.locationId,
      artistId: booking.artistId,
      rating: req.body.rating,
      comment: req.body.comment
    });
    res.status(201).json(fb);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET /feedback/location/:locationId
app.get('/feedback/location/:locationId', async (req, res) => {
  try {
    const feedback = await Feedback.find({ locationId: req.params.locationId }).sort({ createdAt: -1 });
    const avg = feedback.length
      ? (feedback.reduce((s, f) => s + f.rating, 0) / feedback.length).toFixed(1)
      : 0;
    res.json({ feedback, averageRating: avg, count: feedback.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ══════════════════════════════════════════════════════════
// STATS ROUTE (admin)
// ══════════════════════════════════════════════════════════
app.get('/stats', auth, requireRole('admin'), async (req, res) => {
  try {
    const [totalBookings, pendingBookings, approvedBookings, completedBookings,
           rejectedBookings, totalLocations, allFeedback] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'approved' }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'rejected' }),
      Location.countDocuments({ status: 'active' }),
      Feedback.find()
    ]);

    const avgRating = allFeedback.length
      ? (allFeedback.reduce((s, f) => s + f.rating, 0) / allFeedback.length).toFixed(1)
      : 0;

    // Popular locations
    const locStats = await Booking.aggregate([
      { $group: { _id: '$locationId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'locations', localField: '_id', foreignField: '_id', as: 'location' } },
      { $unwind: '$location' },
      { $project: { name: '$location.name', bookings: '$count' } }
    ]);

    // Art type breakdown
    const artStats = await Booking.aggregate([
      { $group: { _id: '$artType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    res.json({
      totalBookings, pendingBookings, approvedBookings,
      completedBookings, rejectedBookings, totalLocations,
      avgRating, popularLocations: locStats, artTypeBreakdown: artStats
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => console.log(`📋 Booking Service running on port ${PORT}`));
