const sheetService = require('./sheetService');

class JobService {
    /**
     * Get all jobs from Φύλλο1 with optional filtering
     */
    async getAllJobs(filters = {}) {
        try {
            const rows = await sheetService.getRows('Φύλλο1');

            let jobs = rows.map(row => ({
                sr_id: row.get('SR ID'),
                assignment_date: row.get('ΗΜΕΡΟΜΗΝΙΑ\nΑΝΑΘΕΣΗΣ'),
                address: row.get('ΔΙΕΥΘΥΝΣΗ'),
                area: row.get('ΠΕΡΙΟΧΗ'),
                postal_code: row.get('ΤΚ'),
                customer: row.get('ΠΕΛΑΤΗΣ'),
                customer_phone: row.get('ΤΗΛ. ΕΠΙΚΟΙΝΩΝΙΑΣ ΠΕΛΑΤΗ'),
                appointment_date: row.get('ΗΜΕΡΟΜΗΝΙΑ ΡΑΝΤΕΒΟΥ'),
                appointment_time: row.get('Ώρα ραντεβού'),
                status: row.get('STATUS\nΕΡΓΑΣΙΩΝ'),
                cab: row.get('CAB'),
                waiting: row.get('ΑΝΑΜΟΝΗ'),
                ττλπ: row.get('ΤΤΛΠ ΑΝΑΘΕΣΗΣ'),
                phase: row.get('ΠΕΡΙΓΡΑΦΗ ΕΡΓΑΣΙΩΝ - ΦΑΣΗ'),
                smart: row.get('SMART READINESS'),
                line_recording: row.get('ΓΡΑΜΜΟΓΡΑΦΗΣΗ'),
                observations: row.get('ΠΑΡΑΤΗΡΗΣΕΙΣ'),
                autopsy_date: row.get('Ημερομηνία ολοκλήρωσης αυτοψίας'),
                digging_date: row.get('Ημερομηνία\nΧωματουργικών'),
                construction_date: row.get('Ημερομηνία\nΚάθετου'),
                optical_date: row.get('Ημερομηνία Οπτικού')
            }));

            // Apply filters
            if (filters.area) {
                jobs = jobs.filter(job => job.area === filters.area);
            }
            if (filters.status) {
                jobs = jobs.filter(job => job.status === filters.status);
            }
            if (filters.date) {
                jobs = jobs.filter(job => job.appointment_date === filters.date);
            }

            return jobs;
        } catch (error) {
            console.error('Error getting jobs:', error);
            throw error;
        }
    }

    /**
     * Get a single job by SR ID
     */
    async getJobById(srId) {
        try {
            const rows = await sheetService.getRows('Φύλλο1');
            const row = rows.find(r => r.get('SR ID') === srId);

            if (!row) return null;

            return {
                sr_id: row.get('SR ID'),
                assignment_date: row.get('ΗΜΕΡΟΜΗΝΙΑ\nΑΝΑΘΕΣΗΣ'),
                address: row.get('ΔΙΕΥΘΥΝΣΗ'),
                area: row.get('ΠΕΡΙΟΧΗ'),
                postal_code: row.get('ΤΚ'),
                customer: row.get('ΠΕΛΑΤΗΣ'),
                customer_phone: row.get('ΤΗΛ. ΕΠΙΚΟΙΝΩΝΙΑΣ ΠΕΛΑΤΗ'),
                appointment_date: row.get('ΗΜΕΡΟΜΗΝΙΑ ΡΑΝΤΕΒΟΥ'),
                appointment_time: row.get('Ώρα ραντεβού'),
                status: row.get('STATUS\nΕΡΓΑΣΙΩΝ'),
                cab: row.get('CAB'),
                waiting: row.get('ΑΝΑΜΟΝΗ'),
                ττλπ: row.get('ΤΤΛΠ ΑΝΑΘΕΣΗΣ'),
                phase: row.get('ΠΕΡΙΓΡΑΦΗ ΕΡΓΑΣΙΩΝ - ΦΑΣΗ'),
                smart: row.get('SMART READINESS'),
                line_recording: row.get('ΓΡΑΜΜΟΓΡΑΦΗΣΗ'),
                observations: row.get('ΠΑΡΑΤΗΡΗΣΕΙΣ'),
                autopsy_date: row.get('Ημερομηνία ολοκλήρωσης αυτοψίας'),
                digging_date: row.get('Ημερομηνία\nΧωματουργικών'),
                construction_date: row.get('Ημερομηνία\nΚάθετου'),
                optical_date: row.get('Ημερομηνία Οπτικού')
            };
        } catch (error) {
            console.error('Error getting job:', error);
            throw error;
        }
    }

    /**
     * Create a new job in Φύλλο1
     */
    async createJob(jobData) {
        try {
            const newJob = {
                'ΗΜΕΡΟΜΗΝΙΑ\nΑΝΑΘΕΣΗΣ': jobData.assignment_date || new Date().toLocaleDateString('en-US'),
                'SR ID': jobData.sr_id,
                'ΔΙΕΥΘΥΝΣΗ': jobData.address,
                'BID': '',
                'ΠΕΡΙΟΧΗ': jobData.area || '',
                'ΕΡΓΟ - REGION': 'ΠΑΡΟΧΟΣ',
                'ΤΤΛΠ ΑΝΑΘΕΣΗΣ': jobData.ττλπ || '',
                'ΠΕΡΙΓΡΑΦΗ ΕΡΓΑΣΙΩΝ - ΦΑΣΗ': jobData.phase || 'Α',
                'STATUS': 'ΝΕΟ',
                'ΠΕΛΑΤΗΣ': jobData.customer,
                'ΤΗΛ. ΕΠΙΚΟΙΝΩΝΙΑΣ ΠΕΛΑΤΗ': jobData.customer_phone,
                'ΣΤΟΙΧΕΙΑ ΔΙΑΧΕΙΡΙΣΤΗ-ΚΙΝΗΤΟ': '',
                'Μηχανικος': '',
                'ΗΜΕΡΟΜΗΝΙΑ ΡΑΝΤΕΒΟΥ': jobData.appointment_date,
                'Ώρα ραντεβού': jobData.appointment_time || '',
                'ΤΚ': jobData.postal_code || '',
                'Υπογραφή': '',
                'Ημερομηνία ολοκλήρωσης αυτοψίας': '',
                'Συστημικό ανέβασμα αυτοψίας': '',
                'STATUS\nΕΡΓΑΣΙΩΝ': jobData.status || 'ΕΚΚΡΕΜΕΙ',
                'SMART READINESS': jobData.smart || 'ΜΕ SMART',
                'CAB': jobData.cab || '',
                'ΑΝΑΜΟΝΗ': jobData.waiting || '',
                'Ημερομηνία\nΧωματουργικών': jobData.digging_date || '',
                'ΧΩΜΑΤΟΥΡΓΙΚΑ': '',
                'Ημερομηνία\nΚάθετου': jobData.construction_date || '',
                'Κάθετο': '',
                'Ημερομηνία\nΕμφύσησης': '',
                'Εμφύσηση': '',
                'Ημερομηνία Οπτικού': jobData.optical_date || '',
                'Οπτικό': '',
                'ΓΡΑΜΜΟΓΡΑΦΗΣΗ': jobData.line_recording || '',
                'ΠΑΡΑΤΗΡΗΣΕΙΣ': jobData.observations || ''
            };

            await sheetService.addRow('Φύλλο1', newJob);
            return { success: true, sr_id: jobData.sr_id };
        } catch (error) {
            console.error('Error creating job:', error);
            throw error;
        }
    }

    /**
     * Update an existing job
     */
    async updateJob(srId, updates) {
        try {
            await sheetService.updateRow('Φύλλο1', 'SR ID', srId, updates);
            return { success: true };
        } catch (error) {
            console.error('Error updating job:', error);
            throw error;
        }
    }

    /**
     * Delete a job
     */
    async deleteJob(srId) {
        try {
            const rows = await sheetService.getRows('Φύλλο1');
            const row = rows.find(r => r.get('SR ID') === srId);

            if (!row) {
                throw new Error('Job not found');
            }

            await row.delete();
            return { success: true };
        } catch (error) {
            console.error('Error deleting job:', error);
            throw error;
        }
    }
}

module.exports = new JobService();
