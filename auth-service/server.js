require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

const app = express();
app.use(cors());
app.use(express.json());

// ─── DB Connection ───────────────────────────────────────────
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ Auth Service: MongoDB connected'))
  .catch(err => console.error('❌ MongoDB error:', err.message));

// ─── Seed default admin/authority accounts ───────────────────
async function seedDefaults() {
  const defaults = [
    { name: 'City Admin', email: 'admin@city.gov', password: 'admin123', role: 'admin' },
    { name: 'Venue Manager', email: 'manager@city.gov', password: 'manager123', role: 'authority' },
    { name: 'Rahul Sharma', email: 'rahul@artist.com', password: 'rahul123', role: 'artist', genre: 'Music', bio: 'Street guitarist from Delhi' },
  ];
  for (const d of defaults) {
    const exists = await User.findOne({ email: d.email });
    if (!exists) {
      await User.create(d);
      console.log(`  Seeded: ${d.email}`);
    }
  }
}
mongoose.connection.once('open', seedDefaults);

// ─── Helper ──────────────────────────────────────────────────
const signToken = (user) => jwt.sign(
  { id: user._id, role: user.role, name: user.name, email: user.email },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRES_IN }
);

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// ─── Routes ──────────────────────────────────────────────────

// Health check
app.get('/health', (req, res) => res.json({ status: 'Auth Service OK', time: new Date() }));

// POST /auth/register
app.post('/auth/register', async (req, res) => {
  try {
    const { name, email, password, genre, bio } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ error: 'Name, email and password are required' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const user = await User.create({ name, email, password, role: 'artist', genre, bio });
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /auth/login
app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: 'Email and password required' });

    const user = await User.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password)))
      return res.status(401).json({ error: 'Invalid email or password' });

    if (!user.isActive)
      return res.status(403).json({ error: 'Account is deactivated' });

    const token = signToken(user);
    const userOut = user.toJSON();
    res.json({ token, user: userOut });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/verify  — used by gateway to validate tokens
app.get('/auth/verify', authMiddleware, (req, res) => {
  res.json({ valid: true, user: req.user });
});

// GET /auth/users  — admin only
app.get('/auth/users', authMiddleware, async (req, res) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ error: 'Admin only' });
  try {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /auth/profile
app.get('/auth/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /auth/profile
app.put('/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { name, genre, bio } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { name, genre, bio },
      { new: true, runValidators: true }
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🔐 Auth Service running on port ${PORT}`));
