const jobService = require('./jobService');
const teamService = require('./teamService');
const sheetService = require('./sheetService');

// Simple in-memory cache
const cache = {
    data: null,
    timestamp: null,
    TTL: 5 * 60 * 1000 // 5 minutes
};

/**
 * Get overview statistics
 */
async function getOverviewStats() {
    try {
        const jobs = await jobService.getAllJobs();

        const total = jobs.length;
        const pending = jobs.filter(j => j.status === 'ΕΚΚΡΕΜΕΙ' || !j.status).length;
        const inProgress = jobs.filter(j =>
            j.status && j.status !== 'ΕΚΚΡΕΜΕΙ' && j.status !== 'ΟΛΟΚΛΗΡΩΘΗΚΕ'
        ).length;
        const completed = jobs.filter(j => j.status === 'ΟΛΟΚΛΗΡΩΘΗΚΕ').length;

        // Count active teams (jobs with at least one team member)
        let activeTeams = 0;
        for (const job of jobs) {
            try {
                const teams = await teamService.getTeamsForJob(job.sr_id);
                const hasMembers = Object.values(teams).some(team => team.length > 0);
                if (hasMembers) activeTeams++;
            } catch (err) {
                // Skip if error
            }
        }

        return {
            totalJobs: total,
            pendingJobs: pending,
            inProgressJobs: inProgress,
            completedJobs: completed,
            activeTeams
        };
    } catch (error) {
        console.error('Error getting overview stats:', error);
        throw error;
    }
}

/**
 * Get jobs distribution by status
 */
async function getJobsByStatus() {
    try {
        const jobs = await jobService.getAllJobs();

        const statusCounts = {};
        jobs.forEach(job => {
            const status = job.status || 'ΕΚΚΡΕΜΕΙ';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        return Object.entries(statusCounts).map(([status, count]) => ({
            status,
            count
        }));
    } catch (error) {
        console.error('Error getting jobs by status:', error);
        throw error;
    }
}

/**
 * Get jobs distribution by type (based on which dates are filled)
 */
async function getJobsByType() {
    try {
        const jobs = await jobService.getAllJobs();

        const typeCounts = {
            'Autopsy': 0,
            'Digging': 0,
            'Construction': 0,
            'Optical': 0
        };

        jobs.forEach(job => {
            if (job.autopsy_date) typeCounts['Autopsy']++;
            if (job.digging_date) typeCounts['Digging']++;
            if (job.construction_date) typeCounts['Construction']++;
            if (job.optical_date) typeCounts['Optical']++;
        });

        return Object.entries(typeCounts).map(([type, count]) => ({
            type,
            count
        }));
    } catch (error) {
        console.error('Error getting jobs by type:', error);
        throw error;
    }
}

/**
 * Get team workload distribution
 */
async function getTeamWorkload() {
    try {
        const jobs = await jobService.getAllJobs();

        const workload = {
            'AUTOPSY': 0,
            'DIGGING': 0,
            'CONSTRUCTION': 0,
            'OPTICAL': 0
        };

        for (const job of jobs) {
            try {
                const teams = await teamService.getTeamsForJob(job.sr_id);
                Object.keys(teams).forEach(teamType => {
                    if (teams[teamType].length > 0) {
                        workload[teamType]++;
                    }
                });
            } catch (err) {
                // Skip if error
            }
        }

        return Object.entries(workload).map(([team, count]) => ({
            team,
            count
        }));
    } catch (error) {
        console.error('Error getting team workload:', error);
        throw error;
    }
}

/**
 * Get jobs timeline (last 30 days)
 */
async function getJobsTimeline() {
    try {
        const jobs = await jobService.getAllJobs();

        // Get last 30 days
        const days = [];
        const today = new Date();
        for (let i = 29; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            days.push({
                date: date.toISOString().split('T')[0],
                count: 0
            });
        }

        // Count jobs by appointment date
        jobs.forEach(job => {
            if (job.appointment_date) {
                const jobDate = new Date(job.appointment_date);
                const dateStr = jobDate.toISOString().split('T')[0];
                const dayEntry = days.find(d => d.date === dateStr);
                if (dayEntry) {
                    dayEntry.count++;
                }
            }
        });

        return days;
    } catch (error) {
        console.error('Error getting jobs timeline:', error);
        throw error;
    }
}

/**
 * Get all stats with caching
 */
async function getAllStats() {
    // Check cache
    if (cache.data && cache.timestamp && (Date.now() - cache.timestamp < cache.TTL)) {
        return cache.data;
    }

    try {
        const [overview, byStatus, byType, workload, timeline] = await Promise.all([
            getOverviewStats(),
            getJobsByStatus(),
            getJobsByType(),
            getTeamWorkload(),
            getJobsTimeline()
        ]);

        const stats = {
            overview,
            byStatus,
            byType,
            workload,
            timeline
        };

        // Update cache
        cache.data = stats;
        cache.timestamp = Date.now();

        return stats;
    } catch (error) {
        console.error('Error getting all stats:', error);
        throw error;
    }
}

module.exports = {
    getOverviewStats,
    getJobsByStatus,
    getJobsByType,
    getTeamWorkload,
    getJobsTimeline,
    getAllStats
};
