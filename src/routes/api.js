const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const userController = require('../controllers/userController');
const photoController = require('../controllers/photoController');
const jobController = require('../controllers/jobController');
const authController = require('../controllers/authController');
const { requireAdmin } = require('../middleware/auth');

// Auth routes (public)
router.post('/auth/signup', authController.signup);
router.post('/auth/login', authController.login);
router.post('/auth/logout', authController.logout);
router.get('/auth/session', authController.getSession);

router.get('/sites', adminController.getSites);
router.get('/reports', adminController.getReports);

// User management routes
router.get('/users', userController.getUsers);
router.put('/users/:user_id', userController.updateUser);
router.post('/sites/:site_id/assign', userController.assignWorker);

// Photo route
router.get('/photo/:file_id', photoController.getPhoto);

// Job management routes (admin only)
router.get('/jobs', requireAdmin, jobController.getJobs);
router.get('/jobs/:sr_id', requireAdmin, jobController.getJob);
router.post('/jobs', requireAdmin, jobController.createJob);
router.put('/jobs/:sr_id', requireAdmin, jobController.updateJob);
router.delete('/jobs/:sr_id', requireAdmin, jobController.deleteJob);

module.exports = router;
