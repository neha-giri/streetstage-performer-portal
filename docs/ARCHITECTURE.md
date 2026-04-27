# StreetStage — System Architecture

## Overview

StreetStage follows a **Microservice Architecture** pattern with an API Gateway as the single entry point for the React frontend. Each service has its own database (Database-per-Service pattern).

---

## Architecture Diagram (Text)

```
┌─────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                          │
│              React Frontend (Port 3000)                  │
│   Login │ Register │ Artist │ Authority │ Admin          │
└──────────────────────┬──────────────────────────────────┘
                       │  HTTP/REST (axios)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   API GATEWAY (Port 8000)                │
│                                                          │
│  • Single entry point for all frontend requests          │
│  • Request routing to downstream services                │
│  • Rate limiting (200 req / 15 min)                      │
│  • CORS handling                                         │
│  • Request logging                                       │
│                                                          │
│  Route Map:                                              │
│  /api/auth/*   → Auth Service     (Port 5001)            │
│  /api/users/*  → Auth Service     (Port 5001)            │
│  /api/*        → Booking Service  (Port 5002)            │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
           ▼                          ▼
┌──────────────────┐      ┌────────────────────────────┐
│   AUTH SERVICE   │      │     BOOKING SERVICE         │
│   (Port 5001)    │      │     (Port 5002)             │
│                  │      │                             │
│  • Register      │      │  • Location CRUD            │
│  • Login (JWT)   │      │  • Booking requests         │
│  • Token verify  │      │  • Approve / Reject         │
│  • User profile  │      │  • Conflict detection       │
│  • User listing  │      │  • Permit generation        │
│                  │      │  • Feedback / ratings       │
│  bcrypt + JWT    │      │  • Admin stats              │
└────────┬─────────┘      └──────────────┬──────────────┘
         │                               │
         ▼                               ▼
┌─────────────────┐         ┌────────────────────────────┐
│    MongoDB      │         │         MongoDB             │
│  streetstage_   │         │    streetstage_bookings     │
│     auth        │         │                             │
│                 │         │  Collections:               │
│  Collections:   │         │  • locations                │
│  • users        │         │  • bookings                 │
└─────────────────┘         │  • feedbacks                │
                            └────────────────────────────┘
```

---

## Service Responsibilities

### API Gateway (Port 8000)
- Single entry point — frontend only talks to this port
- Proxies requests to correct downstream service
- Handles rate limiting and CORS
- Request/response logging
- Returns 503 if a downstream service is down

### Auth Service (Port 5001)
- User registration with bcrypt password hashing
- JWT token generation and verification
- User profile management
- Exposes `/auth/verify` for token validation
- Manages its own MongoDB database (`streetstage_auth`)

### Booking Service (Port 5002)
- Performance location management (CRUD)
- Booking request lifecycle (pending → approved/rejected → completed)
- Overlap/conflict prevention using date+time range checks
- Permit number generation on approval
- Crowd feedback collection and aggregation
- Admin statistics via MongoDB aggregation pipelines
- Manages its own MongoDB database (`streetstage_bookings`)
- Validates JWT tokens locally (shared secret) — no Auth Service call needed

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React | 18.2 |
| Routing | React Router | v6 |
| HTTP Client | Axios | 1.6 |
| API Gateway | Express + http-proxy-middleware | 4.18 / 2.0 |
| Auth Service | Express + Mongoose + bcryptjs + jsonwebtoken | — |
| Booking Service | Express + Mongoose + jsonwebtoken | — |
| Database | MongoDB (local) | 6.x |
| ODM | Mongoose | 7.5 |
| Fonts | Syne + DM Sans (Google Fonts) | — |

---

## Request Flow Example — Artist Books a Slot

```
1. Artist fills booking form in React (Port 3000)
2. Axios POST http://localhost:8000/api/bookings
   Headers: { Authorization: "Bearer <jwt>" }
3. API Gateway receives request on Port 8000
4. Gateway matches /api/* → proxies to Booking Service Port 5002
   Rewrites path: /api/bookings → /bookings
5. Booking Service validates JWT (local verification with shared secret)
6. Booking Service checks MongoDB for time conflicts
7. If no conflict → creates Booking document with status: "pending"
8. Returns 201 with booking object
9. React updates UI to show pending status
```

---

## Request Flow Example — Authority Approves Booking

```
1. Authority clicks "Approve" in dashboard
2. Axios PUT http://localhost:8000/api/bookings/:id/approve
3. API Gateway proxies to Booking Service
4. Booking Service verifies JWT, checks role === 'authority' || 'admin'
5. Booking Service generates PERMIT-XXXXXX
6. Updates MongoDB: status → "approved", permitNumber set
7. Returns updated booking
8. React shows permit number to authority
```

---

## Security Design

- **Passwords:** Hashed with bcrypt (salt rounds: 12) — never stored in plaintext
- **Authentication:** JWT tokens signed with HS256, expire in 7 days
- **Authorization:** Role checked at service level on every protected route
- **Rate Limiting:** 200 requests per 15 minutes per IP (API Gateway)
- **CORS:** Only `http://localhost:3000` allowed as origin
- **No sensitive data in JWT payload:** Only id, role, name, email

---

## Database Schema

### users (Auth DB)
```
{
  _id: ObjectId,
  name: String (required),
  email: String (unique, required),
  password: String (bcrypt hashed, not returned),
  role: enum[artist, authority, admin],
  genre: enum[Music, Dance, ...],
  bio: String,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### locations (Booking DB)
```
{
  _id: ObjectId,
  name: String (required),
  zone: enum[Park, Market, Riverside, Cultural, Square, Commercial],
  address: String (required),
  amenities: [enum[mic, stage, electricity, seating, lighting]],
  maxConcurrent: Number (1-5),
  status: enum[active, inactive],
  createdBy: String (userId),
  createdAt: Date,
  updatedAt: Date
}
```

### bookings (Booking DB)
```
{
  _id: ObjectId,
  artistId: String (ref to auth DB),
  artistName: String (denormalized),
  artistGenre: String (denormalized),
  locationId: ObjectId → locations,
  date: String (YYYY-MM-DD),
  startTime: String (HH:MM),
  endTime: String (HH:MM),
  artType: enum[Music, Dance, Magic, Comedy, Acrobatics, Painting, Theater, Other],
  description: String,
  status: enum[pending, approved, rejected, completed],
  permitNumber: String | null,
  rejectionReason: String | null,
  approvedBy: String | null,
  approvedAt: Date | null,
  createdAt: Date,
  updatedAt: Date
}
```

### feedbacks (Booking DB)
```
{
  _id: ObjectId,
  bookingId: ObjectId → bookings,
  locationId: ObjectId → locations,
  artistId: String,
  rating: Number (1-5),
  comment: String,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Indexes

```javascript
// Conflict detection index (Booking Service)
bookingSchema.index({ locationId: 1, date: 1, status: 1 });
// This makes the conflict check O(log n) instead of O(n)
```
