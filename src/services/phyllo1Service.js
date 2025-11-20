const sheetService = require('./sheetService');

class Phyllo1Service {
    /**
     * Parse date from DD/MM/YYYY format to Date object
     */
    parseDate(dateString) {
        const parts = dateString.split('/');
        if (parts.length !== 3) return null;

        const day = parseInt(parts[0], 10);
        const month = parseInt(parts[1], 10) - 1; // JS months are 0-indexed
        const year = parseInt(parts[2], 10);

        return new Date(year, month, day);
    }

    /**
     * Format Date object to M/D/YYYY format (as used in sheet)
     */
    formatDateForSheet(date) {
        const month = date.getMonth() + 1; // Convert back to 1-indexed
        const day = date.getDate();
        const year = date.getFullYear();

        return `${month}/${day}/${year}`;
    }

    /**
     * Get appointments for a specific date filtered by user role
     * @param {string} dateString - Date in DD/MM/YYYY format
     * @param {string} userRole - User role (WORKER_AUTOPSY, WORKER_DIGGING, etc.)
     * @returns {Array} Array of appointment objects
     */
    async getAppointmentsByDate(dateString, userRole) {
        try {
            // Parse user input date
            const targetDate = this.parseDate(dateString);
            if (!targetDate) {
                throw new Error('Invalid date format. Use DD/MM/YYYY');
            }

            // Format for sheet comparison
            const sheetDateStr = this.formatDateForSheet(targetDate);

            // Get all rows from Φύλλο1
            const rows = await sheetService.getRows('Φύλλο1');

            // Filter by date
            const appointmentsOnDate = rows.filter(row => {
                const appointmentDate = row.get('ΗΜΕΡΟΜΗΝΙΑ ΡΑΝΤΕΒΟΥ');
                return appointmentDate === sheetDateStr;
            });

            // Filter by role and workflow status
            const filteredAppointments = this.filterByRole(appointmentsOnDate, userRole);

            // Map to appointment objects
            return filteredAppointments.map(row => ({
                sr_id: row.get('SR ID'),
                address: row.get('ΔΙΕΥΘΥΝΣΗ'),
                customer: row.get('ΠΕΛΑΤΗΣ'),
                customer_phone: row.get('ΤΗΛ. ΕΠΙΚΟΙΝΩΝΙΑΣ ΠΕΛΑΤΗ'),
                appointment_date: row.get('ΗΜΕΡΟΜΗΝΙΑ ΡΑΝΤΕΒΟΥ'),
                appointment_time: row.get('Ώρα ραντεβού'),
                cab: row.get('CAB'),
                waiting: row.get('ΑΝΑΜΟΝΗ'),
                line_recording: row.get('ΓΡΑΜΜΟΓΡΑΦΗΣΗ'),
                status: row.get('STATUS ΕΡΓΑΣΙΩΝ'),
                area: row.get('ΠΕΡΙΟΧΗ')
            }));
        } catch (error) {
            console.error('Error getting appointments:', error);
            throw error;
        }
    }

    /**
     * Filter appointments by role based on workflow status
     * Workflow: Autopsy → Digging → Construction → Optical → Activation
     */
    filterByRole(appointments, userRole) {
        return appointments.filter(row => {
            const status = row.get('STATUS ΕΡΓΑΣΙΩΝ') || '';

            // WORKER_AUTOPSY: Show all new appointments
            if (userRole === 'WORKER_AUTOPSY') {
                return true; // Autopsy is first step, sees everything
            }

            // WORKER_DIGGING: Show after autopsy is done
            if (userRole === 'WORKER_DIGGING') {
                const autopsyDate = row.get('Ημερομηνία ολοκλήρωσης αυτοψίας');
                return autopsyDate && autopsyDate.trim() !== '';
            }

            // WORKER_CONSTRUCTION: Show after digging is done
            if (userRole === 'WORKER_CONSTRUCTION') {
                const diggingDate = row.get('Ημερομηνία\nΧωματουργικών');
                return diggingDate && diggingDate.trim() !== '';
            }

            // WORKER_OPTICAL: Show after construction is done
            if (userRole === 'WORKER_OPTICAL') {
                const constructionDone = row.get('Κάθετο'); // Assuming this indicates construction done
                return constructionDone && constructionDone.trim() !== '';
            }

            // WORKER_ACTIVATION: Show after optical is done (Cosmote only)
            if (userRole === 'WORKER_ACTIVATION') {
                const opticalDate = row.get('Ημερομηνία Οπτικού');
                return opticalDate && opticalDate.trim() !== '';
            }

            return false;
        });
    }
}

module.exports = new Phyllo1Service();
