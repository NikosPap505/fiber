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

// Team management routes (admin only)
const teamController = require('../controllers/teamController');
router.get('/teams/:job_sr_id', requireAdmin, teamController.getTeams);
router.get('/teams/available/:team_type', requireAdmin, teamController.getAvailableUsers);
router.post('/teams', requireAdmin, teamController.addMember);
router.delete('/teams/:team_id', requireAdmin, teamController.removeMember);

// Statistics routes (admin only)
const statsController = require('../controllers/statsController');
router.get('/stats/overview', requireAdmin, statsController.getOverview);
router.get('/stats/jobs-by-status', requireAdmin, statsController.getJobsByStatus);
router.get('/stats/jobs-by-type', requireAdmin, statsController.getJobsByType);
router.get('/stats/team-workload', requireAdmin, statsController.getTeamWorkload);
router.get('/stats/timeline', requireAdmin, statsController.getJobsTimeline);
router.get('/stats/all', requireAdmin, statsController.getAllStats);

// Calendar routes (admin only)
const calendarController = require('../controllers/calendarController');
router.get('/calendar/events', requireAdmin, calendarController.getEvents);

// Export routes (admin only)
const exportController = require('../controllers/exportController');
router.get('/export/jobs', requireAdmin, exportController.exportJobs);

module.exports = router;
