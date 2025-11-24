const jobService = require('../services/jobService');

/**
 * Calendar Controller
 * Handles calendar-related API endpoints
 */

/**
 * Get calendar events for a date range
 * @route GET /api/calendar/events
 * @query {string} start - Start date (ISO format)
 * @query {string} end - End date (ISO format)
 * @query {string} [status] - Filter by status
 * @query {string} [type] - Filter by job type
 */
async function getEvents(req, res) {
    try {
        const { start, end, status, type } = req.query;

        // Get all jobs
        const jobs = await jobService.getJobs();

        // Filter jobs by date range and optional filters
        const events = jobs
            .filter(job => {
                if (!job.appointment_date) return false;

                // Parse date (handle M/D/Y format from Excel/Sheets)
                let jobDate;
                // Ensure dateStr is a string
                const dateStr = String(job.appointment_date);

                // Try parsing M/D/Y (e.g. 11/23/2025)
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    const month = parseInt(parts[0], 10) - 1;
                    const day = parseInt(parts[1], 10);
                    const year = parseInt(parts[2], 10);
                    jobDate = new Date(year, month, day);
                } else {
                    // Fallback to standard parsing
                    jobDate = new Date(job.appointment_date);
                }

                if (isNaN(jobDate.getTime())) return false;

                const startDate = start ? new Date(start) : null;
                const endDate = end ? new Date(end) : null;

                // Check date range
                if (startDate && jobDate < startDate) return false;
                if (endDate && jobDate > endDate) return false;

                // Check status filter
                if (status && job.status !== status) return false;

                // Check type filter
                if (type && job.type !== type) return false;

                // Store parsed date for mapping
                job._parsedDate = jobDate;

                return true;
            })
            .map(job => {
                // Map job to FullCalendar event format
                // Determine type if not explicitly set
                let jobType = job.type || job.phase || 'Unknown';
                if (jobType === 'Unknown') {
                    if (job.autopsy_date) jobType = 'Autopsy';
                    else if (job.digging_date) jobType = 'Digging';
                    else if (job.construction_date) jobType = 'Construction';
                    else if (job.optical_date) jobType = 'Optical';
                }

                // Normalize type for color mapping
                if (jobType.includes('ΑΥΤΟΨΙΑ') || jobType.includes('Autopsy')) jobType = 'Autopsy';
                else if (jobType.includes('ΧΩΜΑΤΟΥΡΓΙΚΑ') || jobType.includes('Digging')) jobType = 'Digging';
                else if (jobType.includes('ΚΑΘΕΤΟ') || jobType.includes('Construction')) jobType = 'Construction';
                else if (jobType.includes('ΟΠΤΙΚΟ') || jobType.includes('Optical')) jobType = 'Optical';

                const typeColors = {
                    'Autopsy': '#F59E0B',      // Yellow
                    'Digging': '#F97316',      // Orange
                    'Construction': '#3B82F6', // Blue
                    'Optical': '#10B981'       // Green
                };

                const statusBorderColors = {
                    'ΕΚΚΡΕΜΕΙ': '#DC2626',           // Red border
                    'ΣΕ ΕΞΕΛΙΞΗ': '#2563EB',         // Blue border
                    'ΟΛΟΚΛΗΡΩΜΕΝΟ': '#059669'        // Green border
                };

                return {
                    id: job.sr_id,
                    title: `${jobType} - ${job.customer || 'N/A'}`,
                    start: job._parsedDate.toISOString().split('T')[0], // Use YYYY-MM-DD format
                    backgroundColor: typeColors[jobType] || '#6B7280',
                    borderColor: statusBorderColors[job.status] || '#374151',
                    extendedProps: {
                        sr_id: job.sr_id,
                        address: job.address,
                        area: job.area,
                        customer_name: job.customer, // Map 'customer' to 'customer_name' for frontend consistency
                        customer_phone: job.customer_phone,
                        status: job.status,
                        type: jobType,
                        cab: job.cab,
                        notes: job.notes || job.observations // Map observations to notes
                    }
                };
            });

        res.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        // Log stack trace for better debugging
        console.error(error.stack);
        res.status(500).json({ error: 'Failed to fetch calendar events', details: error.message });
    }
}

module.exports = {
    getEvents
};
