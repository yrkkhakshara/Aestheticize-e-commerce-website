#!/bin/bash

# Aestheticize Setup Script
echo "🎨 Welcome to Aestheticize Setup!"
echo "======================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed. Please install MongoDB first."
    exit 1
fi

echo "✅ Node.js and MongoDB are available"

# Navigate to backend directory from project root
cd "$(dirname "$0")/../backend" || exit

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your configuration before proceeding!"
    echo "   Default MongoDB URI: mongodb://localhost:27017/aestheticize"
else
    echo "✅ .env file already exists"
fi

# Start MongoDB (attempt)
echo "🚀 Attempting to start MongoDB..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    brew services start mongodb/brew/mongodb-community 2>/dev/null || echo "⚠️  Please start MongoDB manually: brew services start mongodb/brew/mongodb-community"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    sudo systemctl start mongod 2>/dev/null || echo "⚠️  Please start MongoDB manually: sudo systemctl start mongod"
else
    echo "⚠️  Please start MongoDB manually for your operating system"
fi

# Wait a moment for MongoDB to start
sleep 3

# Seed the database
echo "🌱 Seeding database with sample data..."
node seedDatabase.js

echo ""
echo "🎉 Setup complete!"
echo "======================================"
echo "Next steps:"
echo "1. Update backend/.env with your configuration if needed"
echo "2. Start the backend server:"
echo "   cd backend && npm run dev"
echo "3. Open frontend/index.html in your browser or serve it with:"
echo "   cd frontend && python -m http.server 3000"
echo ""
echo "Sample login credentials:"
echo "Email: admin@aestheticize.com"
echo "Password: Admin123!"
echo ""
echo "API will be available at: http://localhost:5000"
echo "Frontend will be available at: http://localhost:3000"
echo ""
echo "Happy coding! 🚀"
