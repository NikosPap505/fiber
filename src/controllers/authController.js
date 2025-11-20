const userService = require('../services/userService');
const sheetService = require('../services/sheetService');
const bcrypt = require('bcrypt');

class AuthController {
    /**
     * POST /api/auth/signup
     * Register a new user
     */
    async signup(req, res) {
        try {
            const { username, password, name, role } = req.body;

            // Validate required fields
            if (!username || !password || !name) {
                return res.status(400).json({ error: 'Username, password, and name are required' });
            }

            // Check if username already exists
            const users = await sheetService.getRows('Users');
            const existingUser = users.find(u => u.get('username') === username);

            if (existingUser) {
                return res.status(400).json({ error: 'Username already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Generate user ID
            const userId = `U-${Date.now()}`;

            // Create user in sheet
            await sheetService.addRow('Users', {
                user_id: userId,
                username: username,
                password: hashedPassword,
                name: name,
                role: role || 'WORKER_OPTICAL', // Default role
                telegram_chat_id: '', // Empty until linked
                status: 'active'
            });

            res.status(201).json({
                success: true,
                message: 'User registered successfully',
                user_id: userId
            });
        } catch (error) {
            console.error('Signup error:', error);
            res.status(500).json({ error: 'Registration failed' });
        }
    }

    /**
     * POST /api/auth/login
     * Login with username and password
     */
    async login(req, res) {
        try {
            const { username, password } = req.body;

            if (!username || !password) {
                return res.status(400).json({ error: 'Username and password required' });
            }

            // Get user from database
            const users = await sheetService.getRows('Users');
            const userRow = users.find(u => u.get('username') === username);

            if (!userRow) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Verify password
            const hashedPassword = userRow.get('password');
            const isValid = await bcrypt.compare(password, hashedPassword);

            if (!isValid) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Create session
            req.session.user = {
                user_id: userRow.get('user_id'),
                username: userRow.get('username'),
                name: userRow.get('name'),
                role: userRow.get('role'),
                telegram_chat_id: userRow.get('telegram_chat_id')
            };

            res.json({
                success: true,
                user: req.session.user
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed' });
        }
    }

    /**
     * POST /api/auth/logout
     * Logout and destroy session
     */
    logout(req, res) {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({ error: 'Logout failed' });
            }
            res.json({ success: true });
        });
    }

    /**
     * GET /api/auth/session
     * Get current session info
     */
    getSession(req, res) {
        if (req.session && req.session.user) {
            res.json({
                authenticated: true,
                user: req.session.user
            });
        } else {
            res.json({
                authenticated: false
            });
        }
    }
}

module.exports = new AuthController();
