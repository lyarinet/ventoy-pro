#!/bin/bash

# Ventoy Theme Generator - Server Startup Script

echo "🎨 Ventoy Theme Generator"
echo "=========================="
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Create upload directories if they don't exist
mkdir -p server/uploads/backgrounds
mkdir -p server/uploads/icons
mkdir -p server/output

echo "🚀 Starting server..."
echo ""
echo "📍 Server will be available at: http://localhost:3001"
echo "📍 Frontend should be opened separately"
echo ""

# Start the server
node server/server.js
