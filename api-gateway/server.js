require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();

const AUTH_URL    = process.env.AUTH_SERVICE_URL    || 'http://localhost:5001';
const BOOKING_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:5002';

// Allow any localhost port
app.use(cors({
  origin: function(origin, callback) {
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});

app.get('/health', (req, res) => {
  res.json({ status: 'API Gateway OK', auth: AUTH_URL, booking: BOOKING_URL, time: new Date() });
});

async function proxyTo(targetBase, targetPath, req, res) {
  try {
    const url = `${targetBase}${targetPath}`;
    console.log(`  -> Forwarding to: ${url}`);
    const response = await axios({
      method: req.method,
      url,
      headers: {
        'Content-Type': 'application/json',
        ...(req.headers.authorization ? { Authorization: req.headers.authorization } : {})
      },
      data: req.method !== 'GET' ? req.body : undefined,
      validateStatus: () => true
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    console.error('Proxy error:', err.message);
    res.status(503).json({ error: 'Service unavailable: ' + err.message });
  }
}

app.all('/api/auth/{*path}', (req, res) => {
  const targetPath = req.originalUrl.replace('/api/auth', '/auth').split('?')[0];
  proxyTo(AUTH_URL, targetPath, req, res);
});

app.all('/api/users/{*path}', (req, res) => {
  proxyTo(AUTH_URL, '/auth/users', req, res);
});

app.all('/api/users', (req, res) => {
  proxyTo(AUTH_URL, '/auth/users', req, res);
});

app.all('/api/{*path}', (req, res) => {
  const targetPath = req.originalUrl.replace('/api', '').split('?')[0];
  proxyTo(BOOKING_URL, targetPath, req, res);
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log('Gateway running on port ' + PORT);
  console.log('  Auth:    ' + AUTH_URL);
  console.log('  Booking: ' + BOOKING_URL);
});