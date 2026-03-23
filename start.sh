#!/bin/bash

# Ventoy Theme Generator - Complete Startup Script
# This script will:
# 1. Kill any process using port 3001 (server) and 5173 (frontend dev server)
# 2. Install all dependencies
# 3. Initialize SQLite database and migrate old JSON records
# 4. Build the frontend
# 5. Start the server

echo "🎨 Ventoy Theme Generator Pro"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to kill process on a port
kill_port() {
    local PORT=$1
    echo -e "${YELLOW}Checking for processes on port $PORT...${NC}"
    
    # Find PID using the port
    PID=$(lsof -ti:$PORT 2>/dev/null)
    
    if [ ! -z "$PID" ]; then
        echo -e "${YELLOW}Found process (PID: $PID) on port $PORT. Killing...${NC}"
        kill -9 $PID 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ Successfully killed process on port $PORT${NC}"
        else
            echo -e "${RED}✗ Failed to kill process on port $PORT${NC}"
        fi
    else
        echo -e "${GREEN}✓ No process found on port $PORT${NC}"
    fi
}

# Step 1: Kill ports
echo ""
echo "📍 Step 1: Cleaning up ports..."
echo "-----------------------------------"
kill_port 3001  # Server port
kill_port 5173  # Vite dev server port
echo ""

# Step 2: Install dependencies
echo "📍 Step 2: Installing dependencies..."
echo "-----------------------------------"
if [ -f "package.json" ]; then
    echo -e "${BLUE}Installing npm dependencies...${NC}"
    npm install
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Dependencies installed successfully${NC}"
    else
        echo -e "${RED}✗ Failed to install dependencies${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ package.json not found!${NC}"
    exit 1
fi

# Step 3: Initialize database
echo "📍 Step 3: Initializing SQLite database..."
echo "-----------------------------------"
npm run db:init

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ SQLite database is ready${NC}"
else
    echo -e "${RED}✗ Database initialization failed${NC}"
    exit 1
fi
echo ""

# Step 4: Build the project
echo "📍 Step 4: Building the project..."
echo "-----------------------------------"
echo -e "${BLUE}Building frontend application...${NC}"
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Build completed successfully${NC}"
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi
echo ""

# Step 5: Create necessary directories
echo "📍 Step 5: Setting up directories..."
echo "-----------------------------------"
mkdir -p server/uploads/backgrounds
mkdir -p server/uploads/icons
mkdir -p server/uploads/branding
mkdir -p server/output
mkdir -p server/data
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Step 6: Start the server
echo "📍 Step 6: Starting server..."
echo "-----------------------------------"
echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     Ventoy Theme Generator Pro - Starting                ║${NC}"
echo -e "${GREEN}╠══════════════════════════════════════════════════════════╣${NC}"
echo -e "${GREEN}║  Server URL: http://localhost:3001                       ║${NC}"
echo -e "${GREEN}║  Status: Starting...                                     ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Start the server in the background
node server/server.js &
SERVER_PID=$!

# Wait a moment for server to start
sleep 2

# Check if server is running
if ps -p $SERVER_PID > /dev/null; then
    echo -e "${GREEN}✓ Server is running with PID: $SERVER_PID${NC}"
    echo ""
    echo -e "${BLUE}To stop the server, press Ctrl+C or run:${NC}"
    echo -e "  ${YELLOW}kill $SERVER_PID${NC}"
    echo ""
    echo -e "${BLUE}Frontend: Open dist/index.html in your browser or use a static server${NC}"
else
    echo -e "${RED}✗ Server failed to start${NC}"
    exit 1
fi

# Keep the script running
wait
