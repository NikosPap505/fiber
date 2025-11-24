require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
const botService = require('../src/services/botService');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Session configuration for Vercel (HTTPS)
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true for HTTPS in production
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Initialize Bot
// Note: In serverless environments, bot polling might need special handling
try {
  botService.init();
} catch (error) {
  console.error('Bot initialization error:', error);
}

// API Routes
const apiRoutes = require('../src/routes/api');
app.use('/api', apiRoutes);

// Export the app for Vercel serverless function
module.exports = app;

