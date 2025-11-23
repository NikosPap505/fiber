const exportService = require('../services/exportService');

/**
 * Export Controller
 * Handles export-related API endpoints
 */

/**
 * Export jobs
 * @route GET /api/export/jobs
 * @query {string} format - Export format (xlsx, csv, pdf)
 * @query {string} [status] - Filter by status
 * @query {string} [type] - Filter by type
 */
async function exportJobs(req, res) {
    try {
        const { format = 'xlsx', status, type } = req.query;

        const filters = {};
        if (status) filters.status = status;
        if (type) filters.type = type;

        let buffer, contentType, filename;

        switch (format.toLowerCase()) {
            case 'xlsx':
                buffer = await exportService.exportJobsToExcel(filters);
                contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                filename = `jobs_${Date.now()}.xlsx`;
                break;

            case 'csv':
                buffer = Buffer.from(await exportService.exportJobsToCSV(filters));
                contentType = 'text/csv';
                filename = `jobs_${Date.now()}.csv`;
                break;

            case 'pdf':
                const htmlContent = await exportService.exportJobsToPDF(filters);
                contentType = 'text/html';
                filename = `jobs_${Date.now()}.html`;
                buffer = Buffer.from(htmlContent);
                break;

            default:
                return res.status(400).json({ error: 'Invalid format. Use xlsx, csv, or pdf.' });
        }

        res.setHeader('Content-Type', contentType);
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);
    } catch (error) {
        console.error('Error exporting jobs:', error);
        res.status(500).json({ error: 'Failed to export jobs' });
    }
}

module.exports = {
    exportJobs
};
