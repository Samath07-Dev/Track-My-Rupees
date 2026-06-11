#!/bin/bash

# Expense Tracker - Stop Services Script
# This script cleanly shuts down the backend server and MongoDB

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Expense Tracker - Shutdown Script                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

# Stop backend server
if [ -f /tmp/expense-tracker-backend.pid ]; then
    PID=$(cat /tmp/expense-tracker-backend.pid)
    if kill -0 "$PID" 2>/dev/null; then
        print_status "Stopping backend server (PID: $PID)..."
        kill "$PID"
        sleep 1
        if ! kill -0 "$PID" 2>/dev/null; then
            print_success "Backend server stopped"
        else
            print_error "Failed to stop backend server, forcing..."
            kill -9 "$PID"
            print_success "Backend server force stopped"
        fi
    fi
    rm -f /tmp/expense-tracker-backend.pid
else
    print_status "Backend server not running"
fi

# Option to stop MongoDB
echo ""
print_status "MongoDB is still running. To stop it, run:"
echo "   brew services stop mongodb-community"
echo ""
