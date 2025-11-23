const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const jobService = require('./jobService');

/**
 * Export Service
 * Handles data export in various formats
 */

/**
 * Export jobs to Excel
 * @param {Object} filters - Optional filters
 * @returns {Promise<Buffer>} Excel file buffer
 */
async function exportJobsToExcel(filters = {}) {
    try {
        const jobs = await jobService.getJobs(filters);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Jobs');

        // Define columns
        worksheet.columns = [
            { header: 'SR ID', key: 'sr_id', width: 15 },
            { header: 'Date', key: 'appointment_date', width: 12 },
            { header: 'Type', key: 'type', width: 15 },
            { header: 'Status', key: 'status', width: 15 },
            { header: 'Customer', key: 'customer_name', width: 25 },
            { header: 'Phone', key: 'customer_phone', width: 15 },
            { header: 'Address', key: 'address', width: 35 },
            { header: 'Area', key: 'area', width: 20 },
            { header: 'CAB', key: 'cab', width: 15 },
            { header: 'Notes', key: 'notes', width: 40 }
        ];

        // Style header row
        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF4F46E5' }
        };
        worksheet.getRow(1).font = { color: { argb: 'FFFFFFFF' }, bold: true };

        // Add data
        jobs.forEach(job => {
            worksheet.addRow({
                sr_id: job.sr_id,
                appointment_date: job.appointment_date,
                type: job.type,
                status: job.status,
                customer_name: job.customer_name,
                customer_phone: job.customer_phone,
                address: job.address,
                area: job.area,
                cab: job.cab,
                notes: job.notes
            });
        });

        // Auto-filter
        worksheet.autoFilter = {
            from: 'A1',
            to: 'J1'
        };

        // Generate buffer
        const buffer = await workbook.xlsx.writeBuffer();
        return buffer;
    } catch (error) {
        console.error('Error exporting jobs to Excel:', error);
        throw error;
    }
}

/**
 * Export jobs to CSV
 * @param {Object} filters - Optional filters
 * @returns {Promise<string>} CSV string
 */
async function exportJobsToCSV(filters = {}) {
    try {
        const jobs = await jobService.getJobs(filters);

        // CSV header
        const headers = ['SR ID', 'Date', 'Type', 'Status', 'Customer', 'Phone', 'Address', 'Area', 'CAB', 'Notes'];
        let csv = headers.join(',') + '\n';

        // CSV rows
        jobs.forEach(job => {
            const row = [
                job.sr_id || '',
                job.appointment_date || '',
                job.type || '',
                job.status || '',
                `"${(job.customer_name || '').replace(/"/g, '""')}"`,
                job.customer_phone || '',
                `"${(job.address || '').replace(/"/g, '""')}"`,
                job.area || '',
                job.cab || '',
                `"${(job.notes || '').replace(/"/g, '""')}"`
            ];
            csv += row.join(',') + '\n';
        });

        return csv;
    } catch (error) {
        console.error('Error exporting jobs to CSV:', error);
        throw error;
    }
}

/**
 * Export jobs to PDF (simplified HTML version)
 * @param {Object} filters - Optional filters
 * @returns {Promise<string>} HTML string for PDF
 */
async function exportJobsToPDF(filters = {}) {
    try {
        const jobs = await jobService.getJobs(filters);

        // Generate simple HTML for PDF
        let html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Jobs Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #4F46E5; color: white; }
        tr:nth-child(even) { background-color: #f2f2f2; }
        .footer { margin-top: 20px; text-align: center; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <h1>Jobs Report</h1>
    <p style="text-align: center;">Generated: ${new Date().toLocaleDateString('el-GR')}</p>
    <table>
        <thead>
            <tr>
                <th>SR ID</th>
                <th>Date</th>
                <th>Type</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Address</th>
                <th>Area</th>
            </tr>
        </thead>
        <tbody>
`;

        jobs.forEach(job => {
            html += `
            <tr>
                <td>${job.sr_id || ''}</td>
                <td>${job.appointment_date || ''}</td>
                <td>${job.type || ''}</td>
                <td>${job.status || ''}</td>
                <td>${job.customer_name || ''}</td>
                <td>${job.address || ''}</td>
                <td>${job.area || ''}</td>
            </tr>
`;
        });

        html += `
        </tbody>
    </table>
    <div class="footer">
        <p>Total Jobs: ${jobs.length}</p>
        <p>Fiber Management System</p>
    </div>
</body>
</html>
`;

        return html;
    } catch (error) {
        console.error('Error exporting jobs to PDF:', error);
        throw error;
    }
}

module.exports = {
    exportJobsToExcel,
    exportJobsToCSV,
    exportJobsToPDF
};
