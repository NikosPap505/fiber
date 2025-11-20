const sheetService = require('../services/sheetService');

class UserController {
    async getUsers(req, res) {
        try {
            const rows = await sheetService.getRows('Users');
            const users = rows.map(row => ({
                user_id: row.get('user_id'),
                name: row.get('name'),
                role: row.get('role'),
                telegram_chat_id: row.get('telegram_chat_id'),
                active: row.get('active') || 'YES'
            }));
            res.json(users);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async updateUser(req, res) {
        try {
            const { user_id } = req.params;
            const updates = req.body;

            const success = await sheetService.updateRow('Users', 'user_id', user_id, updates);

            if (success) {
                res.json({ message: 'User updated successfully' });
            } else {
                res.status(404).json({ error: 'User not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async assignWorker(req, res) {
        try {
            const { site_id } = req.params;
            const { user_id } = req.body;

            const success = await sheetService.updateRow('Sites', 'site_id', site_id, {
                assigned_to: user_id
            });

            if (success) {
                res.json({ message: 'Worker assigned successfully' });
            } else {
                res.status(404).json({ error: 'Site not found' });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new UserController();
