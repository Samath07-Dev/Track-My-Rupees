#!/bin/bash

# Expense Tracker - Complete Startup Script
# This script ensures MongoDB and the backend server are running before starting the app

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_DIR/backend"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     Expense Tracker - Application Startup Script               ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

# ═══════════════════════════════════════════════════════════════════════
# STEP 1: Check if MongoDB is running
# ═══════════════════════════════════════════════════════════════════════

print_status "Checking MongoDB status..."

if lsof -Pi :27017 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    print_success "MongoDB is already running on port 27017"
else
    print_warning "MongoDB is not running"
    
    # Check if MongoDB is installed via Homebrew
    if command -v mongod &> /dev/null; then
        print_status "Starting MongoDB..."
        
        # Try to start MongoDB
        if brew services start mongodb-community >/dev/null 2>&1; then
            print_success "MongoDB started successfully"
            sleep 2
        else
            print_error "Failed to start MongoDB via Homebrew"
            print_warning "Trying to start MongoDB directly..."
            
            mongod --config /usr/local/etc/mongod.conf --fork --logpath /tmp/mongodb.log >/dev/null 2>&1 || {
                print_error "Could not start MongoDB automatically"
                echo ""
                echo "Please start MongoDB manually:"
                echo "  brew services start mongodb-community"
                echo "  OR"
                echo "  mongod --fork --logpath /tmp/mongodb.log"
                echo ""
                exit 1
            }
            print_success "MongoDB started successfully"
            sleep 2
        fi
    else
        print_error "MongoDB is not installed"
        echo ""
        echo "Please install MongoDB:"
        echo "  brew install mongodb-community"
        echo "  brew services start mongodb-community"
        echo ""
        exit 1
    fi
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 2: Check if .env exists in backend
# ═══════════════════════════════════════════════════════════════════════

print_status "Checking backend configuration..."

if [ ! -f "$BACKEND_DIR/.env" ]; then
    print_error "Backend .env file not found!"
    echo "Creating .env file with default values..."
    
    cat > "$BACKEND_DIR/.env" << 'EOF'
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/expense-tracker
JWT_SECRET=super_secret_jwt_key_here_expense_123
EOF
    
    print_success "Created .env file at $BACKEND_DIR/.env"
else
    print_success ".env file found"
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 3: Start backend server in the background
# ═══════════════════════════════════════════════════════════════════════

print_status "Starting backend server..."

# Check if backend dependencies are installed
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
    print_warning "Backend dependencies not installed. Installing..."
    cd "$BACKEND_DIR"
    npm install >/dev/null 2>&1
    cd "$PROJECT_DIR"
    print_success "Backend dependencies installed"
fi

# Start backend in the background
cd "$BACKEND_DIR"
npm start > /tmp/expense-tracker-backend.log 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" > /tmp/expense-tracker-backend.pid

print_status "Backend server starting (PID: $BACKEND_PID)..."

# Wait for backend to be ready
echo ""
print_status "Waiting for backend to be ready..."
MAX_ATTEMPTS=15
ATTEMPT=0

while [ $ATTEMPT -lt $MAX_ATTEMPTS ]; do
    if curl -s http://localhost:5001/api/health >/dev/null 2>&1; then
        print_success "Backend is ready and responding"
        break
    fi
    ATTEMPT=$((ATTEMPT+1))
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        echo -n "."
        sleep 1
    fi
done

echo ""

if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
    print_error "Backend failed to start after ${MAX_ATTEMPTS} seconds"
    echo ""
    echo "Backend logs:"
    tail -20 /tmp/expense-tracker-backend.log
    echo ""
    kill $BACKEND_PID 2>/dev/null || true
    exit 1
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 4: Check frontend dependencies
# ═══════════════════════════════════════════════════════════════════════

cd "$PROJECT_DIR"

print_status "Checking frontend dependencies..."

if [ ! -d "node_modules" ]; then
    print_warning "Frontend dependencies not installed. Installing..."
    npm install >/dev/null 2>&1
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies found"
fi

# ═══════════════════════════════════════════════════════════════════════
# STEP 5: Summary and next steps
# ═══════════════════════════════════════════════════════════════════════

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                    ✓ STARTUP COMPLETE                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
print_success "MongoDB is running on port 27017"
print_success "Backend server is running on port 5001"
echo ""
print_status "To start the frontend development server, run:"
echo "   npm run dev"
echo ""
print_status "Test users available:"
echo "   Email: test@example.com"
echo "   Password: password123"
echo ""
print_warning "Backend logs: tail -f /tmp/expense-tracker-backend.log"
echo ""
print_status "To stop the backend later, run:"
echo "   kill $(cat /tmp/expense-tracker-backend.pid 2>/dev/null || echo 'PID')"
echo ""
