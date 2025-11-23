const teamService = require('../services/teamService');

class TeamController {
    /**
     * GET /api/teams/:job_sr_id
     * Get all teams for a specific job
     */
    async getTeams(req, res) {
        try {
            const teams = await teamService.getTeamsByJob(req.params.job_sr_id);
            res.json(teams);
        } catch (error) {
            console.error('Error in getTeams:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * POST /api/teams
     * Add a member to a team
     */
    async addMember(req, res) {
        try {
            const { job_sr_id, team_type, user_id, user_name, is_custom } = req.body;

            if (!job_sr_id || !team_type || !user_name) {
                return res.status(400).json({ error: 'Missing required fields' });
            }

            // For custom names, user_id can be null
            if (!is_custom && !user_id) {
                return res.status(400).json({ error: 'User ID required for registered users' });
            }

            const result = await teamService.addTeamMember(job_sr_id, team_type, user_id, user_name);
            res.status(201).json(result);
        } catch (error) {
            console.error('Error in addMember:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * DELETE /api/teams/:team_id
     * Remove a member from a team
     */
    async removeMember(req, res) {
        try {
            const result = await teamService.removeTeamMember(req.params.team_id);
            res.json(result);
        } catch (error) {
            console.error('Error in removeMember:', error);
            res.status(500).json({ error: error.message });
        }
    }

    /**
     * GET /api/teams/available/:team_type
     * Get available users for a team type
     */
    async getAvailableUsers(req, res) {
        try {
            const users = await teamService.getAvailableUsers(req.params.team_type);
            res.json(users);
        } catch (error) {
            console.error('Error in getAvailableUsers:', error);
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new TeamController();
