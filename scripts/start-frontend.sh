#!/bin/bash

echo "🎨 Starting Aestheticize Frontend Server..."

# Navigate to frontend directory from project root
cd "$(dirname "$0")/../frontend"

echo "📂 Serving files from: $(pwd)"
echo "🌐 Frontend will be available at: http://localhost:3000"
echo "🔧 Press Ctrl+C to stop the server"
echo ""

# Start the Python HTTP server
python3 -m http.server 3000
