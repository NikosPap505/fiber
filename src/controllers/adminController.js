const sheetService = require('../services/sheetService');

class AdminController {
    async getSites(req, res) {
        try {
            const rows = await sheetService.getRows('Sites');
            const sites = rows.map(row => ({
                site_id: row.get('site_id'),
                address: row.get('address'),
                area: row.get('area'),
                type: row.get('type'),
                status: row.get('status'),
                assigned_to: row.get('assigned_to'),
                created_at: row.get('created_at')
            }));
            res.json(sites);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

    async getReports(req, res) {
        try {
            const type = req.query.type || 'all';
            let allReports = [];

            if (type === 'construction' || type === 'all') {
                const rows = await sheetService.getRows('Construction_Reports');
                const reports = rows.map(row => ({
                    report_id: row.get('report_id'),
                    site_id: row.get('site_id'),
                    user_id: row.get('user_id'),
                    date: row.get('date'),
                    type: 'Construction',
                    bcp_installed: row.get('bcp_installed'),
                    bep_installed: row.get('bep_installed'),
                    bmo_installed: row.get('bmo_installed'),
                    photo_url: row.get('photo_url'),
                    comments: row.get('comments')
                }));
                allReports = allReports.concat(reports);
            }

            if (type === 'digging' || type === 'all') {
                const rows = await sheetService.getRows('Digging_Reports');
                const reports = rows.map(row => ({
                    report_id: row.get('report_id'),
                    site_id: row.get('site_id'),
                    user_id: row.get('user_id'),
                    date: row.get('date'),
                    type: 'Digging',
                    trench_dug: row.get('trench_dug'),
                    cable_laid: row.get('cable_laid'),
                    backfill_done: row.get('backfill_done'),
                    photo_url: row.get('photo_url'),
                    comments: row.get('comments')
                }));
                allReports = allReports.concat(reports);
            }

            if (type === 'autopsy' || type === 'all') {
                const rows = await sheetService.getRows('Autopsy_Reports');
                const reports = rows.map(row => ({
                    report_id: row.get('report_id'),
                    site_id: row.get('site_id'),
                    user_id: row.get('user_id'),
                    date: row.get('date'),
                    type: 'Autopsy',
                    photo_url: row.get('photo_url'),
                    comments: row.get('comments')
                }));
                allReports = allReports.concat(reports);
            }

            if (type === 'optical' || type === 'all') {
                const rows = await sheetService.getRows('Optical_Reports');
                const reports = rows.map(row => ({
                    report_id: row.get('report_id'),
                    site_id: row.get('site_id'),
                    user_id: row.get('user_id'),
                    date: row.get('date'),
                    type: 'Optical',
                    splicing_done: row.get('splicing_done'),
                    measurements: row.get('measurements'),
                    photo_url: row.get('photo_url'),
                    comments: row.get('comments')
                }));
                allReports = allReports.concat(reports);
            }

            // Sort by date descending
            allReports.sort((a, b) => new Date(b.date) - new Date(a.date));

            res.json(allReports);
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
}

module.exports = new AdminController();
