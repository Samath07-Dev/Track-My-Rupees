const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const User = require('./models/User');
const Transaction = require('./models/Transaction');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Track MongoDB connection status
let mongoConnected = false;

// MongoDB connection with retry logic
const connectMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 10,
      minPoolSize: 5,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
      retryWrites: true,
      w: 'majority'
    });
    mongoConnected = true;
    console.log(`[${new Date().toISOString()}] ✓ MongoDB connected successfully`);
  } catch (err) {
    mongoConnected = false;
    console.error(`[${new Date().toISOString()}] ✗ MongoDB connection error:`, err.message);
    // Retry connection after 5 seconds
    setTimeout(connectMongoDB, 5000);
  }
};

// Handle MongoDB disconnection
mongoose.connection.on('disconnected', () => {
  mongoConnected = false;
  console.warn(`[${new Date().toISOString()}] ⚠ MongoDB disconnected, attempting to reconnect...`);
  setTimeout(connectMongoDB, 5000);
});

mongoose.connection.on('error', (err) => {
  mongoConnected = false;
  console.error(`[${new Date().toISOString()}] ✗ MongoDB error:`, err.message);
});

// Initial connection attempt
connectMongoDB();

// ==================== HEALTH CHECK ENDPOINT ====================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongodb: mongoConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ==================== AUTH ROUTES ====================

// Register endpoint
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if MongoDB is connected
    if (!mongoConnected) {
      console.error(`[${new Date().toISOString()}] ✗ Registration attempt with MongoDB disconnected`);
      return res.status(503).json({ 
        message: 'Database service is unavailable. Please ensure MongoDB is running and restart the server.' 
      });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Please fill in all registration fields' });
    }

    let user = await User.findOne({ email });
    if (user) {
      console.warn(`[${new Date().toISOString()}] Registration attempt: Email already exists (${email})`);
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({
      name,
      email,
      password: hashedPassword
    });

    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    console.log(`[${new Date().toISOString()}] ✓ New user registered: ${email}`);
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ✗ Registration error:`, error.message);
    res.status(500).json({ message: error.message || 'Registration failed' });
  }
});

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if MongoDB is connected
    if (!mongoConnected) {
      console.error(`[${new Date().toISOString()}] ✗ Login attempt with MongoDB disconnected`);
      return res.status(503).json({ 
        message: 'Database service is unavailable. Please ensure MongoDB is running and restart the server.' 
      });
    }

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    let user = await User.findOne({ email });
    if (!user) {
      console.warn(`[${new Date().toISOString()}] Login attempt: User not found (${email})`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.warn(`[${new Date().toISOString()}] Login attempt: Wrong password (${email})`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });

    console.log(`[${new Date().toISOString()}] ✓ User logged in successfully: ${email}`);
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt } });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ✗ Login error:`, error.message);
    res.status(500).json({ message: 'Login failed. Please try again or contact support.' });
  }
});

// Verify token
app.post('/api/auth/verify', (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, userId: decoded.user.id });
  } catch (error) {
    res.status(401).json({ valid: false, message: 'Invalid or expired token' });
  }
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

// Get all transactions for logged-in user
app.get('/api/transactions', verifyToken, async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.user.id }).sort({ date: -1 });
    res.json(transactions);
  } catch (error) {
    console.error('Fetch transactions error:', error);
    res.status(500).json({ message: error.message || 'Failed to fetch transactions' });
  }
});

// Create a new transaction
app.post('/api/transactions', verifyToken, async (req, res) => {
  try {
    const { category, amount, date, description, type } = req.body;

    if (!category || !amount || !date) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const transaction = new Transaction({
      userId: req.user.id,
      category,
      amount: parseFloat(amount),
      date,
      description: description || '',
      type: (type || 'expense').toLowerCase()
    });

    await transaction.save();
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ message: error.message || 'Failed to create transaction' });
  }
});

// Update a transaction
app.put('/api/transactions/:id', verifyToken, async (req, res) => {
  try {
    const { category, amount, date, description, type } = req.body;

    let transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this transaction' });
    }

    if (category) transaction.category = category;
    if (amount) transaction.amount = parseFloat(amount);
    if (date) transaction.date = date;
    if (description !== undefined) transaction.description = description;
    if (type) transaction.type = type.toLowerCase();

    await transaction.save();
    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ message: error.message || 'Failed to update transaction' });
  }
});

// Delete a transaction
app.delete('/api/transactions/:id', verifyToken, async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    if (transaction.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this transaction' });
    }

    await Transaction.findByIdAndDelete(req.params.id);
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ message: error.message || 'Failed to delete transaction' });
  }
});

const PORT = process.env.PORT || 5000;

// Graceful shutdown
process.on('SIGINT', () => {
  console.log(`\n[${new Date().toISOString()}] ⚠ Received SIGINT, shutting down gracefully...`);
  mongoose.connection.close(false, () => {
    console.log(`[${new Date().toISOString()}] ✓ MongoDB connection closed`);
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log(`\n[${new Date().toISOString()}] ⚠ Received SIGTERM, shutting down gracefully...`);
  mongoose.connection.close(false, () => {
    console.log(`[${new Date().toISOString()}] ✓ MongoDB connection closed`);
    process.exit(0);
  });
});

// Uncaught exception handler
process.on('uncaughtException', (err) => {
  console.error(`[${new Date().toISOString()}] ✗ UNCAUGHT EXCEPTION:`, err);
  process.exit(1);
});

// Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error(`[${new Date().toISOString()}] ✗ UNHANDLED REJECTION at:`, promise, 'reason:', reason);
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${new Date().toISOString()}] 🚀 Expense Tracker Backend Started`);
  console.log(`${'='.repeat(60)}`);
  console.log(`Port: ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`MongoDB: ${process.env.MONGO_URI}`);
  console.log(`${'='.repeat(60)}\n`);
});

// Set timeout for server
server.setTimeout(60000);
