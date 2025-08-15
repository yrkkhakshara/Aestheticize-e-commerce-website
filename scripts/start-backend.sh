#!/bin/bash

echo "Starting Aestheticize Backend Server..."
echo "Current directory: $(pwd)"

# Navigate to backend directory from project root
cd "$(dirname "$0")/../backend"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Start the server
echo "Starting server on port 5001..."
node server.js
