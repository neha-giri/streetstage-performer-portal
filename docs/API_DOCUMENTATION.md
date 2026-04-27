# StreetStage API Documentation

**Base URL:** `http://localhost:8000/api`  
**Auth:** Bearer JWT token in `Authorization` header  
**Content-Type:** `application/json`

---

## Authentication Service (Port 5001)

### POST `/api/auth/register`
Register a new artist account.

**Request Body:**
```json
{
  "name": "Neha Giri",
  "email": "ngiri@gmail.com",
  "password": "Neha@1234",
  "genre": "Music",
  "bio": "Street guitarist from Delhi"
}
```

**Response 201:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Neha Giri",
    "email": "ngiri@gmail.com",
    "role": "artist",
    "genre": "Music",
    "bio": "Street guitarist from Delhi",
    "createdAt": "2025-04-24T10:00:00.000Z"
  }
}
```

**Errors:**
- `400` — Email already registered / missing fields
- `500` — Server error

---

### POST `/api/auth/login`
Login and receive JWT token.

**Request Body:**
```json
{ "email": "admin@city.gov", "password": "admin123" }
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "City Admin",
    "email": "admin@city.gov",
    "role": "admin"
  }
}
```

**Errors:**
- `401` — Invalid credentials
- `403` — Account deactivated

---

### GET `/api/auth/verify`
Validate a JWT token. Used internally by services.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{ "valid": true, "user": { "id": "...", "role": "admin", "name": "City Admin" } }
```

---

### GET `/api/auth/profile`
Get current user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response 200:** Full user object

---

### PUT `/api/auth/profile`
Update current user's profile.

**Request Body:**
```json
{ "name": "New Name", "genre": "Dance", "bio": "Updated bio" }
```

---

### GET `/api/users`
Get all registered users. *Admin only.*

**Response 200:** Array of user objects (password excluded)

---

## Booking Service (Port 5002)

### GET `/api/locations`
Get all performance locations.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| zone | string | Filter by zone (Park, Market, Riverside, Cultural, Square, Commercial) |
| status | string | Filter by status (active, inactive) |
| search | string | Search by name (regex) |

**Response 200:**
```json
[
  {
    "_id": "64f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Central Park Stage",
    "zone": "Park",
    "address": "MG Road, Zone A",
    "amenities": ["mic", "stage", "electricity"],
    "maxConcurrent": 1,
    "status": "active",
    "createdAt": "2025-04-24T10:00:00.000Z"
  }
]
```

---

### POST `/api/locations`
Create a new location. *Admin only.*

**Request Body:**
```json
{
  "name": "Sunset Plaza",
  "zone": "Commercial",
  "address": "Main Road, Zone E",
  "amenities": ["mic", "lighting"],
  "maxConcurrent": 2
}
```

**Response 201:** Created location object

---

### PUT `/api/locations/:id`
Update a location. *Admin only.*

**Response 200:** Updated location object

---

### DELETE `/api/locations/:id`
Delete a location. *Admin only.*

**Response 200:**
```json
{ "success": true, "message": "Location deleted" }
```

---

### POST `/api/bookings`
Create a booking request. *Artist only.*

**Request Body:**
```json
{
  "locationId": "64f1a2b3c4d5e6f7a8b9c0d1",
  "date": "2025-05-10",
  "startTime": "14:00",
  "endTime": "16:00",
  "artType": "Music",
  "description": "Live guitar performance"
}
```

**Response 201:**
```json
{
  "_id": "64f1a2b3c4d5e6f7a8b9c0d2",
  "artistId": "...",
  "artistName": "Neha Giri",
  "locationId": { "_id": "...", "name": "Central Park Stage", "zone": "Park" },
  "date": "2025-05-10",
  "startTime": "14:00",
  "endTime": "16:00",
  "artType": "Music",
  "status": "pending",
  "permitNumber": null,
  "createdAt": "2025-04-24T10:00:00.000Z"
}
```

**Errors:**
- `400` — Missing fields / start >= end time / location inactive
- `409` — **Time slot conflict** — another booking exists for same location/date/time

---

### GET `/api/bookings/my`
Get current artist's own bookings.

**Query Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| status | string | Filter: pending, approved, rejected, completed |

**Response 200:** Array of populated booking objects

---

### GET `/api/bookings`
Get all bookings. *Authority/Admin only.*

**Query Parameters:** `status`, `date`, `locationId`

**Response 200:** Array of all bookings with populated location

---

### PUT `/api/bookings/:id/approve`
Approve a pending booking and issue permit. *Authority/Admin only.*

**Response 200:**
```json
{
  "_id": "...",
  "status": "approved",
  "permitNumber": "PERMIT-A1B2C3",
  "approvedBy": "...",
  "approvedAt": "2025-04-24T11:00:00.000Z"
}
```

**Errors:**
- `400` — Booking is not in pending state

---

### PUT `/api/bookings/:id/reject`
Reject a pending booking. *Authority/Admin only.*

**Request Body:**
```json
{ "reason": "Location maintenance scheduled" }
```

---

### PUT `/api/bookings/:id/complete`
Mark a booking as completed. *Artist (own) or Authority/Admin.*

---

### POST `/api/feedback/:bookingId`
Submit crowd feedback for a completed booking.

**Request Body:**
```json
{ "rating": 5, "comment": "Incredible performance, huge crowd!" }
```

---

### GET `/api/feedback/location/:locationId`
Get all feedback for a location.

**Response 200:**
```json
{
  "feedback": [...],
  "averageRating": "4.5",
  "count": 12
}
```

---

### GET `/api/stats`
Get platform-wide statistics. *Admin only.*

**Response 200:**
```json
{
  "totalBookings": 45,
  "pendingBookings": 8,
  "approvedBookings": 12,
  "completedBookings": 20,
  "rejectedBookings": 5,
  "totalLocations": 4,
  "avgRating": "4.3",
  "popularLocations": [
    { "name": "Central Park Stage", "bookings": 18 }
  ],
  "artTypeBreakdown": [
    { "_id": "Music", "count": 22 },
    { "_id": "Dance", "count": 15 }
  ]
}
```

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@city.gov | admin123 |
| Authority | manager@city.gov | manager123 |
| Artist | rahul@artist.com | rahul123 |

---

## Error Response Format

All errors follow this format:
```json
{ "error": "Human-readable error message" }
```

| Status | Meaning |
|--------|---------|
| 400 | Bad Request — missing/invalid fields |
| 401 | Unauthorized — no token or invalid token |
| 403 | Forbidden — insufficient role |
| 404 | Not Found |
| 409 | Conflict — time slot already booked |
| 503 | Service Unavailable — microservice down |
