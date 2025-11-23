const statsService = require('../services/statsService');

/**
 * Get overview statistics
 */
async function getOverview(req, res) {
    try {
        const stats = await statsService.getOverviewStats();
        res.json(stats);
    } catch (error) {
        console.error('Error in getOverview:', error);
        res.status(500).json({ error: 'Failed to get overview statistics' });
    }
}

/**
 * Get jobs by status
 */
async function getJobsByStatus(req, res) {
    try {
        const stats = await statsService.getJobsByStatus();
        res.json(stats);
    } catch (error) {
        console.error('Error in getJobsByStatus:', error);
        res.status(500).json({ error: 'Failed to get jobs by status' });
    }
}

/**
 * Get jobs by type
 */
async function getJobsByType(req, res) {
    try {
        const stats = await statsService.getJobsByType();
        res.json(stats);
    } catch (error) {
        console.error('Error in getJobsByType:', error);
        res.status(500).json({ error: 'Failed to get jobs by type' });
    }
}

/**
 * Get team workload
 */
async function getTeamWorkload(req, res) {
    try {
        const stats = await statsService.getTeamWorkload();
        res.json(stats);
    } catch (error) {
        console.error('Error in getTeamWorkload:', error);
        res.status(500).json({ error: 'Failed to get team workload' });
    }
}

/**
 * Get jobs timeline
 */
async function getJobsTimeline(req, res) {
    try {
        const stats = await statsService.getJobsTimeline();
        res.json(stats);
    } catch (error) {
        console.error('Error in getJobsTimeline:', error);
        res.status(500).json({ error: 'Failed to get jobs timeline' });
    }
}

/**
 * Get all statistics
 */
async function getAllStats(req, res) {
    try {
        const stats = await statsService.getAllStats();
        res.json(stats);
    } catch (error) {
        console.error('Error in getAllStats:', error);
        res.status(500).json({ error: 'Failed to get statistics' });
    }
}

module.exports = {
    getOverview,
    getJobsByStatus,
    getJobsByType,
    getTeamWorkload,
    getJobsTimeline,
    getAllStats
};
