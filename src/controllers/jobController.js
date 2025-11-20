const jobService = require('../services/jobService');

class JobController {
    /**
     * GET /api/jobs
     * Get all jobs with optional filtering
     */
    async getJobs(req, res) {
        try {
            const filters = {
                area: req.query.area,
                status: req.query.status,
                date: req.query.date
            };

            // Remove undefined filters
            Object.keys(filters).forEach(key =>
                filters[key] === undefined && delete filters[key]
            );

            const jobs = await jobService.getAllJobs(filters);
            res.json(jobs);
        } catch (error) {
            console.error('Error in getJobs:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/jobs/:sr_id
     * Get a single job by SR ID
     */
    async getJob(req, res) {
        try {
            const job = await jobService.getJobById(req.params.sr_id);

            if (!job) {
                return res.status(404).json({ error: 'Job not found' });
            }

            res.json(job);
        } catch (error) {
            console.error('Error in getJob:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/jobs
     * Create a new job
     */
    async createJob(req, res) {
        try {
            const jobData = req.body;

            // Validate required fields
            if (!jobData.sr_id) {
                return res.status(400).json({ error: 'SR ID is required' });
            }
            if (!jobData.address) {
                return res.status(400).json({ error: 'Address is required' });
            }
            if (!jobData.customer) {
                return res.status(400).json({ error: 'Customer name is required' });
            }

            const result = await jobService.createJob(jobData);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error in createJob:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * PUT /api/jobs/:sr_id
     * Update an existing job
     */
    async updateJob(req, res) {
        try {
            const updates = req.body;
            const result = await jobService.updateJob(req.params.sr_id, updates);
            res.json(result);
        } catch (error) {
            console.error('Error in updateJob:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * DELETE /api/jobs/:sr_id
     * Delete a job
     */
    async deleteJob(req, res) {
        try {
            const result = await jobService.deleteJob(req.params.sr_id);
            res.json(result);
        } catch (error) {
            console.error('Error in deleteJob:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new JobController();
