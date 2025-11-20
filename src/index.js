require('dotenv').config();
const express = require('express');
const cors = require('cors');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const botService = require('./services/botService');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Set to true if using HTTPS
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

app.use(express.static('public'));


// Initialize Bot
botService.init();

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);


// Basic Route
app.get('/', (req, res) => {
  res.send('Fiber Construction Management System API is running');
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${ PORT } `);
});
