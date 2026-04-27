# ⚡ StreetStage — Quick Start

## Requirements
- Node.js >= 16
- MongoDB running locally on port 27017

## Step 1 — Install all dependencies
```bash
cd auth-service    && npm install && cd ..
cd booking-service && npm install && cd ..
cd api-gateway     && npm install && cd ..
cd frontend        && npm install && cd ..
```

## Step 2 — Start all 4 services (4 separate terminals)

| Terminal | Command | Port |
|----------|---------|------|
| 1 | `cd auth-service && node server.js` | 5001 |
| 2 | `cd booking-service && node server.js` | 5002 |
| 3 | `cd api-gateway && node server.js` | 8000 |
| 4 | `cd frontend && npm start` | 3000 |

## Step 3 — Open http://localhost:3000

## Demo Accounts
| Role | Email | Password |
|------|-------|----------|
| Admin | admin@city.gov | admin123 |
| Authority | manager@city.gov | manager123 |
| Artist | rahul@artist.com | rahul123 |

## Common Errors

**"MongooseServerSelectionError"** → MongoDB is not running. Start it first.
```bash
sudo systemctl start mongod   # Linux
brew services start mongodb-community  # macOS
```

**"503 Service Unavailable"** → A backend service is not running. Check all 3 terminals.

**CORS error in browser** → Make sure API Gateway (port 8000) is running.
