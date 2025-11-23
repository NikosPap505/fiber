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
                const dateStr = job.appointment_date;

                // Try parsing M/D/Y (e.g. 11/23/2025)
                const parts = dateStr.split('/');
                if (parts.length === 3) {
                    const month = parseInt(parts[0], 10) - 1;
                    const day = parseInt(parts[1], 10);
                    const year = parseInt(parts[2], 10);
                    jobDate = new Date(year, month, day);
                } else {
                    // Fallback to standard parsing
                    jobDate = new Date(dateStr);
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
                const typeColors = {
                    'Autopsy': '#F59E0B',      // Yellow
                    'Digging': '#F97316',      // Orange
                    'Construction': '#3B82F6', // Blue
                    'Optical': '#10B981'       // Green
                };

                const statusBorderColors = {
                    'ΕΚΚΡΕΜΕΙ': '#DC2626',           // Red border
                    'ΣΕ ΕΞΕΛΙΞΗ': '#2563EB',         // Blue border
                    'ΟΛΟΚΛΗΡΩΘΗΚΕ': '#059669'        // Green border
                };

                return {
                    id: job.sr_id,
                    title: `${job.type} - ${job.customer_name || 'N/A'}`,
                    start: job._parsedDate.toISOString().split('T')[0], // Use YYYY-MM-DD format
                    backgroundColor: typeColors[job.type] || '#6B7280',
                    borderColor: statusBorderColors[job.status] || '#374151',
                    extendedProps: {
                        sr_id: job.sr_id,
                        address: job.address,
                        area: job.area,
                        customer_name: job.customer_name,
                        customer_phone: job.customer_phone,
                        status: job.status,
                        type: job.type,
                        cab: job.cab,
                        notes: job.notes
                    }
                };
            });

        res.json(events);
    } catch (error) {
        console.error('Error fetching calendar events:', error);
        res.status(500).json({ error: 'Failed to fetch calendar events' });
    }
}

module.exports = {
    getEvents
};
