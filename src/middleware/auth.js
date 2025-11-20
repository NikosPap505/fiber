// Authentication middleware

function verifySession(req, res, next) {
    if (req.session && req.session.user) {
        // Session exists and is valid
        req.user = req.session.user;
        next();
    } else {
        // No valid session - redirect to login
        if (req.path.startsWith('/api/')) {
            // API request - return 401
            res.status(401).json({ error: 'Not authenticated' });
        } else {
            // Page request - redirect to login
            res.redirect('/login.html');
        }
    }
}

function requireAuth(req, res, next) {
    if (req.session && req.session.user) {
        req.user = req.session.user;
        next();
    } else {
        res.status(401).json({ error: 'Authentication required' });
    }
}

function requireAdmin(req, res, next) {
    if (req.session && req.session.user && req.session.user.role === 'ADMIN') {
        req.user = req.session.user;
        next();
    } else {
        res.status(403).json({ error: 'Admin access required' });
    }
}

module.exports = {
    verifySession,
    requireAuth,
    requireAdmin
};
