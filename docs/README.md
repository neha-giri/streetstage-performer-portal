#  StreetStage — Street Performer Slot Booking Portal

> Full Stack Application Development — Assignment Submission

**Student:** Neha Giri | **ID:** 2025TM93144
---

## Problem Statement

Cities have designated spots for street artists. This portal manages the full lifecycle of performance slot booking:
- Artists register and book performance slots at specific city locations
- City Authority approves/rejects requests and manages permits
- Administrators monitor platform usage, manage locations, and track all activity

---

## Architecture

**Microservice Architecture** with 3 backend services:

```
React Frontend (3000) → API Gateway (8000) → Auth Service (5001) + Booking Service (5002)
                                                    ↓                        ↓
                                              MongoDB (auth)         MongoDB (bookings)
```

See `docs/ARCHITECTURE.md` for full architecture details.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Axios |
| API Gateway | Express, http-proxy-middleware, express-rate-limit |
| Auth Service | Express, Mongoose, bcryptjs, jsonwebtoken |
| Booking Service | Express, Mongoose, jsonwebtoken |
| Database | MongoDB (2 separate databases) |

---

## Prerequisites

- Node.js >= 16
- MongoDB running locally on port 27017

### Install MongoDB (if not installed)
```bash
# Ubuntu/Debian
sudo apt install mongodb
sudo systemctl start mongodb

# macOS
brew install mongodb-community
brew services start mongodb-community

# Windows: Download from https://www.mongodb.com/try/download/community
```

---

## Setup & Run

### Step 1 — Install all dependencies

```bash
# Auth Service
cd auth-service && npm install && cd ..

# Booking Service
cd booking-service && npm install && cd ..

# API Gateway
cd api-gateway && npm install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### Step 2 — Start all services (4 terminals)

**Terminal 1 — Auth Service:**
```bash
cd auth-service
node server.js
# Output: Auth Service running on port 5001
```

**Terminal 2 — Booking Service:**
```bash
cd booking-service
node server.js
# Output: Booking Service running on port 5002
```

**Terminal 3 — API Gateway:**
```bash
cd api-gateway
node server.js
# Output: API Gateway running on port 8000
```

**Terminal 4 — React Frontend:**
```bash
cd frontend
npm start
# Opens http://localhost:3000
```

### Step 3 — Open browser

Navigate to **http://localhost:3000**

---

## Demo Accounts (Auto-seeded on first run)

| Role | Email | Password | Access |
|------|-------|----------|--------|
| **Admin** | admin@city.gov | admin123 | Full access + location management |
| **Authority** | manager@city.gov | manager123 | Approve/reject bookings |
| **Artist** | rahul@artist.com | rahul123 | Browse spots, book slots |

---

## Project Structure

```
streetstage-v2/
├── auth-service/
│   ├── models/
│   │   └── User.js           # Mongoose schema with bcrypt
│   ├── server.js             # Auth routes: register, login, verify, profile
│   ├── .env                  # PORT, MONGO_URI, JWT_SECRET
│   └── package.json
│
├── booking-service/
│   ├── models/
│   │   ├── Location.js       # Performance spots
│   │   ├── Booking.js        # Booking with conflict index
│   │   └── Feedback.js       # Crowd ratings
│   ├── server.js             # All booking/location/feedback/stats routes
│   ├── .env
│   └── package.json
│
├── api-gateway/
│   ├── server.js             # Proxy routing + rate limiting + CORS
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── public/index.html
│   └── src/
│       ├── App.js            # Routes + PrivateRoute guard
│       ├── App.css           # Global dark theme design system
│       ├── index.js
│       ├── context/
│       │   └── AuthContext.js    # Login/logout/register state
│       ├── utils/
│       │   └── api.js            # Axios base URL + interceptors
│       ├── components/
│       │   └── Layout.js         # Sidebar navigation shell
│       └── pages/
│           ├── Login.js
│           ├── Register.js
│           ├── ArtistDashboard.js
│           ├── AuthorityDashboard.js
│           └── AdminDashboard.js
│
└── docs/
    ├── API_DOCUMENTATION.md      # Full REST API reference
    ├── ARCHITECTURE.md           # System design + DB schema + diagrams
    ├── AI_USAGE_REPORT.md        # AI usage log + reflection
    └── README.md                 # This file
```

---

## Features Implemented

### User Authentication & Roles 
- Register (artists only via UI) / Login for all roles
- Role-based access: `artist`, `authority`, `admin`
- JWT tokens (signed with HS256, expire 7 days)
- bcrypt password hashing (12 salt rounds)
- Protected routes in React (PrivateRoute component)

### Location Management (Admin) 
- Add / Edit / Delete performance spots
- Fields: name, zone, address, amenities, max concurrent performers
- Status control (active/inactive)

### Booking & Approval Flow 
- Artists submit booking requests with date + time slot
- **Conflict prevention:** Rejects overlapping bookings for same location/date/time
- Authority approves → **Permit number auto-generated**
- Authority rejects → reason stored and shown to artist
- Artist marks performance as completed
- Artist submits crowd feedback (1–5 stars + comment)

### Search & Dashboard 
- Filter locations by zone and search by name
- Filter bookings by status/date/location
- Admin stats: total bookings, popular locations, art type breakdown, average rating

### Microservice Architecture 
- Auth Service (Port 5001) — handles all identity concerns
- Booking Service (Port 5002) — handles all booking concerns
- API Gateway (Port 8000) — single entry point, proxying, rate limiting
- Each service has its own MongoDB database (database-per-service pattern)

---

## API Reference Summary

| Method | Endpoint | Service | Role |
|--------|----------|---------|------|
| POST | /api/auth/register | Auth | Public |
| POST | /api/auth/login | Auth | Public |
| GET | /api/auth/profile | Auth | Any |
| GET | /api/users | Auth | Admin |
| GET | /api/locations | Booking | Any |
| POST | /api/locations | Booking | Admin |
| PUT | /api/locations/:id | Booking | Admin |
| DELETE | /api/locations/:id | Booking | Admin |
| POST | /api/bookings | Booking | Artist |
| GET | /api/bookings/my | Booking | Artist |
| GET | /api/bookings | Booking | Authority/Admin |
| PUT | /api/bookings/:id/approve | Booking | Authority/Admin |
| PUT | /api/bookings/:id/reject | Booking | Authority/Admin |
| PUT | /api/bookings/:id/complete | Booking | Artist/Admin |
| POST | /api/feedback/:bookingId | Booking | Any |
| GET | /api/stats | Booking | Admin |

Full API docs: `docs/API_DOCUMENTATION.md`

---

## Deliverables Checklist

-  Source Code (this repository)
-  API Documentation (`docs/API_DOCUMENTATION.md`)
-  Architecture + DB Schema (`docs/ARCHITECTURE.md`)
-  AI Usage Log + Reflection (`docs/AI_USAGE_REPORT.md`)
-  GitHub Repository (upload and make public)
-  Demo Video (record and upload to Google Drive)

---

## Known Limitations

- MongoDB must be running locally (no cloud DB configured)
- No email verification for registration
- No pagination on large listing responses
- Demo only — not production-hardened (no HTTPS, no secrets manager)
