const sheetService = require('./sheetService');

class UserService {
    async getUserByTelegramId(telegramId) {
        const rows = await sheetService.getRows('Users', { telegram_chat_id: telegramId });
        if (rows.length > 0) {
            const row = rows[0];
            return {
                user_id: row.get('user_id'),
                name: row.get('name'),
                role: row.get('role'),
                active: row.get('active') === 'TRUE'
            };
        }
        return null;
    }

    async createUser(userData) {
        // Check if exists
        const existing = await this.getUserByTelegramId(userData.telegram_chat_id);
        if (existing) return existing;

        await sheetService.addRow('Users', {
            user_id: userData.user_id || `U-${Date.now()}`,
            name: userData.name,
            role: userData.role || 'PENDING', // Default role
            telegram_chat_id: userData.telegram_chat_id,
            active: 'TRUE'
        });

        return await this.getUserByTelegramId(userData.telegram_chat_id);
    }

    async getDailyProgram(userId) {
        // Get user to determine role
        const userRows = await sheetService.getRows('Users', { user_id: userId });
        if (userRows.length === 0) return [];

        const userRole = userRows[0].get('role');

        // Get all sites assigned to this user
        const allSites = await sheetService.getRows('Sites');
        const assignedSites = allSites.filter(site => site.get('assigned_to') === userId);

        // Filter based on role and sequential workflow
        let filteredSites = [];

        if (userRole === 'WORKER_CONSTRUCTION') {
            // Construction workers: get PENDING or DIGGING_DONE sites
            filteredSites = assignedSites.filter(site => {
                const status = site.get('status');
                return status === 'PENDING' || status === 'DIGGING_DONE';
            });
        } else if (userRole === 'WORKER_DIGGING') {
            // Digging workers: get Construction type sites that are PENDING
            filteredSites = assignedSites.filter(site => {
                const status = site.get('status');
                const type = site.get('type');
                return status === 'PENDING' && type === 'Construction';
            });
        } else if (userRole === 'WORKER_OPTICAL') {
            // Optical workers: get sites where digging is done
            filteredSites = assignedSites.filter(site => {
                const status = site.get('status');
                return status === 'DIGGING_DONE';
            });
        }

        // Exclude completed sites
        filteredSites = filteredSites.filter(site => site.get('status') !== 'COMPLETED');

        return filteredSites.map(site => ({
            site_id: site.get('site_id'),
            address: site.get('address'),
            type: site.get('type'),
            status: site.get('status')
        }));
    }
}

module.exports = new UserService();
