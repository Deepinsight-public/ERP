#!/bin/bash

echo "🚀 ERP System Test Script"
echo "=========================="

# Kill any existing processes
echo "Stopping any existing dev servers..."
pkill -f "npm run dev" 2>/dev/null || true
pkill -f "ts-node" 2>/dev/null || true

# Wait for ports to be free
sleep 2

echo "📊 Starting Backend Server..."
cd backend
npm run dev &
BACKEND_PID=$!

echo "⏳ Waiting for backend to start..."
sleep 5

echo "🎨 Starting Frontend Server..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "⏳ Waiting for frontend to start..."
sleep 10

echo "🧪 Testing Services..."
echo "Backend Health Check:"
curl -s http://localhost:3001/health || echo "❌ Backend not responding"

echo -e "\nFrontend Check:"
curl -s -I http://localhost:3000 | head -1 || echo "❌ Frontend not responding"

echo -e "\n✅ ERP System Test Complete!"
echo "📝 Access the system at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"

echo -e "\n🔑 Demo Login Credentials:"
echo "   Headquarter: admin@demo.com"
echo "   Store:       store@demo.com" 
echo "   Warehouse:   warehouse@demo.com"

echo -e "\n⏹️  To stop servers: pkill -f 'npm run dev'" 