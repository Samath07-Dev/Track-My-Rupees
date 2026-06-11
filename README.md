# 💰 Expense Tracker

A modern expense tracking application built with React (Vite) frontend and Express.js backend with MongoDB.

## ✨ Features

- 🔐 User authentication with JWT
- 📊 Track income and expenses
- 📈 View transaction history
- 🎨 Clean, modern UI with Lucide icons
- 📱 Responsive design

## 🚀 Quick Start

### Prerequisites
- Node.js (v16+)
- MongoDB (installed via Homebrew on macOS)
- npm

### First-Time Setup

1. **Install MongoDB** (if not already installed)
```bash
brew install mongodb-community
brew services start mongodb-community
```

2. **Start the application** (all-in-one)
```bash
cd ~/Desktop/"expense tracker"
./start-app.sh
```

This script automatically:
- ✓ Starts MongoDB
- ✓ Installs backend dependencies
- ✓ Starts the backend server on port 5001
- ✓ Checks frontend dependencies
- ✓ Provides setup instructions

3. **Start the frontend** (in a new terminal)
```bash
cd ~/Desktop/"expense tracker"
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🔑 Test Credentials

Login with these test credentials:
- **Email:** `test@example.com`
- **Password:** `password123`

## 📚 Project Structure

```
expense-tracker/
├── src/                      # React frontend
│   ├── components/          # Reusable components
│   ├── pages/              # Page components (Login, Dashboard, etc.)
│   ├── context/            # Auth context
│   ├── App.jsx
│   └── main.jsx
├── backend/                 # Express.js server
│   ├── models/             # MongoDB schemas
│   ├── server.js           # Main server file
│   ├── .env                # Environment variables
│   └── package.json
├── start-app.sh           # Automated startup script
├── stop-app.sh            # Shutdown script
└── README.md
```

## 🛠️ Development

### Frontend Development
```bash
npm run dev          # Start Vite dev server
npm run build        # Build for production
npm run preview       # Preview production build
```

### Backend Development
```bash
cd backend
npm start            # Start Express server on port 5001
```

### View Backend Logs
```bash
tail -f /tmp/expense-tracker-backend.log
```

## 🔧 Troubleshooting

### Login failures
**Solution:** Make sure both MongoDB and backend server are running
```bash
./start-app.sh       # Starts everything automatically
```

### MongoDB not running
```bash
brew services start mongodb-community
```

### Backend connection errors
```bash
# Check backend health
curl http://localhost:5001/api/health

# Check logs
tail -f /tmp/expense-tracker-backend.log

# Restart backend
kill $(cat /tmp/expense-tracker-backend.pid)
./start-app.sh
```

### Port conflicts
- Frontend runs on: `5173` (can be changed in vite.config.js)
- Backend runs on: `5001` (can be changed in backend/.env)
- MongoDB runs on: `27017` (default MongoDB port)

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/verify` - Verify JWT token

### Transactions
- `GET /api/transactions` - Get all transactions
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Health Check
- `GET /api/health` - Check backend health and MongoDB status

## 🔐 Security Notes

- JWT tokens expire in 7 days
- Passwords are hashed with bcryptjs
- Frontend stores token in localStorage
- Backend validates all requests with JWT middleware

## 🆘 Getting Help

Check the detailed troubleshooting guide:
```bash
cat LOGIN_FIX_GUIDE.md
```

## 📝 License

This project is for personal use.

## 🎯 Key Commands Reference

```bash
# Start everything
./start-app.sh

# Stop everything
./stop-app.sh

# Start frontend dev server
npm run dev

# View backend logs
tail -f /tmp/expense-tracker-backend.log

# Stop backend
kill $(cat /tmp/expense-tracker-backend.pid)

# Check backend health
curl http://localhost:5001/api/health

# Test login
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

---

**Last Updated:** May 12, 2026  
**Status:** ✅ All login issues permanently fixed
# TrackMyRupees
