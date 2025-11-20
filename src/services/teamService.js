const sheetService = require('./sheetService');

class TeamService {
    /**
     * Get all teams for a specific job
     */
    async getTeamsByJob(jobSrId) {
        try {
            const rows = await sheetService.getRows('Teams');

            const teams = {
                AUTOPSY: [],
                CONSTRUCTION: [],
                DIGGING: [],
                OPTICAL: []
            };

            rows.forEach(row => {
                if (row.get('job_sr_id') === jobSrId && row.get('status') === 'active') {
                    const teamType = row.get('team_type');
                    if (teams[teamType]) {
                        teams[teamType].push({
                            team_id: row.get('team_id'),
                            user_id: row.get('user_id'),
                            user_name: row.get('user_name'),
                            assigned_date: row.get('assigned_date')
                        });
                    }
                }
            });

            return teams;
        } catch (error) {
            console.error('Error getting teams:', error);
            throw error;
        }
    }

    /**
     * Add a member to a team
     */
    async addTeamMember(jobSrId, teamType, userId, userName) {
        try {
            const teamId = `T-${Date.now()}`;
            const assignedDate = new Date().toLocaleDateString('en-US');

            await sheetService.addRow('Teams', {
                team_id: teamId,
                job_sr_id: jobSrId,
                team_type: teamType,
                user_id: userId,
                user_name: userName,
                assigned_date: assignedDate,
                status: 'active'
            });

            return { success: true, team_id: teamId };
        } catch (error) {
            console.error('Error adding team member:', error);
            throw error;
        }
    }

    
    async removeTeamMember(teamId) {
        try {
            const rows = await sheetService.getRows('Teams');
            const row = rows.find(r => r.get('team_id') === teamId);

            if (!row) {
                throw new Error('Team member not found');
            }

        
            row.set('status', 'removed');
            await row.save();

            return { success: true };
        } catch (error) {
            console.error('Error removing team member:', error);
            throw error;
        }
    }

   
    async getAvailableUsers(teamType) {
        try {
            const roleMap = {
                'AUTOPSY': 'WORKER_AUTOPSY',
                'CONSTRUCTION': 'WORKER_CONSTRUCTION',
                'DIGGING': 'WORKER_DIGGING',
                'OPTICAL': 'WORKER_OPTICAL'
            };

            const targetRole = roleMap[teamType];
            const rows = await sheetService.getRows('Users');

            const users = rows
                .filter(row => row.get('role') === targetRole && row.get('active') !== 'false')
                .map(row => ({
                    user_id: row.get('user_id'),
                    name: row.get('name'),
                    role: row.get('role')
                }));

            return users;
        } catch (error) {
            console.error('Error getting available users:', error);
            throw error;
        }
    }
}

module.exports = new TeamService();
