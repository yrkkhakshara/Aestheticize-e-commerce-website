#!/bin/bash

echo "🔍 Aestheticize Project Status Check"
echo "======================================"

# Check if MongoDB is running
echo "📊 Checking MongoDB..."
if pgrep mongod > /dev/null; then
    echo "✅ MongoDB is running"
else
    echo "❌ MongoDB is not running"
fi

# Check if backend server is running
echo "📊 Checking Backend Server (port 5001)..."
if lsof -i :5001 > /dev/null; then
    echo "✅ Backend server is running on port 5001"
else
    echo "❌ Backend server is not running on port 5001"
fi

# Check if frontend server is running
echo "📊 Checking Frontend Server (port 3000)..."
if lsof -i :3000 > /dev/null; then
    echo "✅ Frontend server is running on port 3000"
else
    echo "❌ Frontend server is not running on port 3000"
fi

echo ""
echo "📁 Project Structure:"
echo "├── backend/     $(ls backend/ | wc -l | xargs) items"
echo "├── frontend/    $(ls frontend/ | wc -l | xargs) items"
echo "├── docs/        $(ls docs/ | wc -l | xargs) items"
echo "└── scripts/     $(ls scripts/ | wc -l | xargs) items"

echo ""
if lsof -i :5001 > /dev/null && lsof -i :3000 > /dev/null; then
    echo "🎉 Project is fully operational!"
    echo "🌐 Frontend: http://localhost:3000"
    echo "🔧 Backend:  http://localhost:5001"
else
    echo "⚠️  Some services are not running. Use scripts to start them:"
    echo "   ./scripts/start-backend.sh"
    echo "   ./scripts/start-frontend.sh"
fi

echo "======================================"
