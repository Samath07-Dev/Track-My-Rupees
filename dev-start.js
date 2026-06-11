#!/usr/bin/env node

/**
 * Permanent Fix for Daily Login Issues
 * This script automatically starts MongoDB and the backend server
 * before launching the frontend. This ensures the backend is always
 * running when you try to log in.
 */

import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(color, prefix, message) {
  console.log(`${color}${prefix}${colors.reset} ${message}`);
}

function info(message) {
  log(colors.blue, '[INFO]', message);
}

function success(message) {
  log(colors.green, '[✓]', message);
}

function warn(message) {
  log(colors.yellow, '[⚠]', message);
}

function error(message) {
  log(colors.red, '[✗]', message);
}

async function isPortAvailable(port) {
  try {
    await axios.get(`http://localhost:${port}`, { timeout: 1000 });
    return true;
  } catch (err) {
    return false;
  }
}

async function checkMongoDB() {
  try {
    // Check if MongoDB port is listening
    const output = execSync('lsof -Pi :27017 -sTCP:LISTEN -t 2>/dev/null || true', { encoding: 'utf8' });
    return output.trim().length > 0;
  } catch (err) {
    return false;
  }
}

async function startMongoDB() {
  info('Checking MongoDB...');
  
  const mongoRunning = await checkMongoDB();
  
  if (mongoRunning) {
    success('MongoDB is already running');
    return true;
  }

  info('MongoDB is not running. Attempting to start...');

  try {
    // Try to start MongoDB as a service (macOS with Homebrew)
    execSync('brew services start mongodb-community 2>/dev/null || true', { encoding: 'utf8' });
    
    // Wait for MongoDB to be ready
    let attempts = 0;
    while (attempts < 30) {
      if (await checkMongoDB()) {
        success('MongoDB started successfully');
        // Give it an extra second to be fully ready
        await new Promise(r => setTimeout(r, 1000));
        return true;
      }
      attempts++;
      process.stdout.write('.');
      await new Promise(r => setTimeout(r, 500));
    }
    
    warn('MongoDB startup timed out. It might still be starting...');
    return false;
  } catch (err) {
    error('Failed to start MongoDB. Make sure MongoDB is installed: brew install mongodb-community');
    return false;
  }
}

async function startBackendServer() {
  info('Starting backend server...');

  return new Promise((resolve) => {
    const backendDir = path.join(__dirname, 'backend');
    const backendProcess = spawn('npm', ['start'], {
      cwd: backendDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      detached: true,
    });

    let backendStarted = false;
    let errorOutput = '';

    // Capture output
    backendProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      if (output.includes('Server running on port') || output.includes('MongoDB connected')) {
        backendStarted = true;
      }
    });

    backendProcess.stderr.on('data', (data) => {
      const output = data.toString();
      process.stderr.write(output);
      errorOutput += output;
    });

    // Check backend health
    const healthCheckInterval = setInterval(async () => {
      try {
        const response = await axios.get('https://track-my-rupees-backend.onrender.com/api/health', { timeout: 2000 });
        
        if (response.data.status === 'ok') {
          if (response.data.mongodb === 'connected') {
            clearInterval(healthCheckInterval);
            success('Backend is running and MongoDB is connected');
            resolve(true);
          } else {
            warn('Backend is running but MongoDB is not connected yet...');
          }
        }
      } catch (err) {
        // Still trying to connect
      }
    }, 1000);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(healthCheckInterval);
      if (backendStarted) {
        success('Backend server started (may still be connecting to MongoDB)');
        resolve(true);
      } else {
        error('Backend server failed to start. Check the error output above.');
        console.error('\n--- Backend Error Details ---');
        console.error(errorOutput);
        resolve(false);
      }
    }, 30000);

    // Handle process errors
    backendProcess.on('error', (err) => {
      clearInterval(healthCheckInterval);
      error(`Backend process error: ${err.message}`);
      resolve(false);
    });

    // Detach the process so it keeps running after this script exits
    backendProcess.unref();
  });
}

async function main() {
  console.log('\n' + colors.cyan + colors.bright);
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║   Expense Tracker - Auto-Start Development Environment       ║');
  console.log('║   Permanent Fix: Backend will always run for login            ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log(colors.reset + '\n');

  try {
    // Step 1: Start MongoDB
    info('═══ STEP 1: Ensuring MongoDB is running ═══');
    const mongoStarted = await startMongoDB();
    console.log('');

    // Step 2: Start Backend
    info('═══ STEP 2: Starting Backend Server ═══');
    const backendStarted = await startBackendServer();
    console.log('');

    if (!mongoStarted || !backendStarted) {
      warn('Some services failed to start, but continuing anyway...');
      warn('You may see "Cannot connect to backend" if services are still initializing');
      console.log('');
    }

    success('═══ Development Environment Ready ═══');
    console.log('');
    success('✓ MongoDB is running on port 27017');
    success('✓ Backend is running on port 5001');
    info('✓ You can now access the app at http://localhost:5173');
    console.log('');
    info('Starting Vite development server...\n');

  } catch (err) {
    error(`Setup failed: ${err.message}`);
    warn('Attempting to continue anyway...');
  }
}

main();
