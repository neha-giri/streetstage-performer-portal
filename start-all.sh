#!/bin/bash
# StreetStage — Start All Services
# Run: bash start-all.sh

echo "🎭 Starting StreetStage Platform..."
echo ""

# Check MongoDB
if ! pgrep -x mongod > /dev/null 2>&1; then
  echo "⚠️  MongoDB is not running!"
  echo "   Start it with: sudo systemctl start mongod  (Linux)"
  echo "                  brew services start mongodb-community  (macOS)"
  echo ""
fi

# Start Auth Service
echo "Starting Auth Service (Port 5001)..."
cd auth-service && node server.js &
AUTH_PID=$!
cd ..
sleep 1

# Start Booking Service
echo "Starting Booking Service (Port 5002)..."
cd booking-service && node server.js &
BOOKING_PID=$!
cd ..
sleep 1

# Start API Gateway
echo "Starting API Gateway (Port 8000)..."
cd api-gateway && node server.js &
GATEWAY_PID=$!
cd ..
sleep 1

# Start Frontend
echo "Starting React Frontend (Port 3000)..."
cd frontend && npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "═══════════════════════════════════════"
echo "✅ All services started!"
echo ""
echo "  Frontend:    http://localhost:3000"
echo "  API Gateway: http://localhost:8000"
echo "  Auth:        http://localhost:5001"
echo "  Booking:     http://localhost:5002"
echo ""
echo "Demo Accounts:"
echo "  Admin:     admin@city.gov / admin123"
echo "  Authority: manager@city.gov / manager123"
echo "  Artist:    rahul@artist.com / rahul123"
echo "═══════════════════════════════════════"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup on exit
trap "kill $AUTH_PID $BOOKING_PID $GATEWAY_PID $FRONTEND_PID 2>/dev/null" EXIT
wait
