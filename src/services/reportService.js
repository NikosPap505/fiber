const sheetService = require('./sheetService');

class ReportService {
    async submitConstructionReport(data) {
        // 1. Save to Construction_Reports
        const reportId = `R-C-${Date.now()}`;
        const rowData = {
            report_id: reportId,
            site_id: data.site_id,
            user_id: data.user_id,
            date: new Date().toISOString(),
            bcp_installed: data.bcp_installed,
            bep_installed: data.bep_installed,
            bmo_installed: data.bmo_installed,
            photo_url: data.photo_url || '',
            comments: data.comments || ''
        };
        console.log('📊 Data being sent to sheetService.addRow:', rowData);
        await sheetService.addRow('Construction_Reports', rowData);

        // 2. Update Site Status
        // Logic: If all installed, mark as COMPLETED (or whatever logic applies)
        // For now, we just mark as 'CONSTRUCTION_DONE' or keep it IN_PROGRESS
        let newStatus = 'IN_PROGRESS';
        if (data.bcp_installed === 'YES' && data.bep_installed === 'YES') {
            newStatus = 'CONSTRUCTION_DONE';
        }

        await sheetService.updateRow('Sites', 'site_id', data.site_id, {
            status: newStatus
        });

        return reportId;
    }

    async submitOpticalReport(data) {
        // 1. Save to Optical_Reports
        const reportId = `R-O-${Date.now()}`;
        await sheetService.addRow('Optical_Reports', {
            report_id: reportId,
            site_id: data.site_id,
            user_id: data.user_id,
            date: new Date().toISOString(),
            splicing_done: data.splicing_done,
            measurements: data.measurements || '',
            CAB: data.CAB || '',
            ΑΝΑΜΟΝΗ: data.ΑΝΑΜΟΝΗ || '',
            ΓΡΑΜΜΟΓΡΑΦΗΣΗ: data.ΓΡΑΜΜΟΓΡΑΦΗΣΗ || '',
            photo_url: data.photo_url || '',
            comments: data.comments || ''
        });

        // 2. Update Site Status
        let newStatus = 'IN_PROGRESS';
        if (data.splicing_done === 'YES') {
            newStatus = 'OPTICAL_DONE';
        }

        await sheetService.updateRow('Sites', 'site_id', data.site_id, {
            status: newStatus
        });

        return reportId;
    }

    async submitDiggingReport(data) {
        // 1. Save to Digging_Reports
        const reportId = `R-D-${Date.now()}`;
        await sheetService.addRow('Digging_Reports', {
            report_id: reportId,
            site_id: data.site_id,
            user_id: data.user_id,
            date: new Date().toISOString(),
            trench_dug: data.trench_dug,
            cable_laid: data.cable_laid,
            backfill_done: data.backfill_done,
            CAB: data.CAB || '',
            ΑΝΑΜΟΝΗ: data.ΑΝΑΜΟΝΗ || '',
            ΓΡΑΜΜΟΓΡΑΦΗΣΗ: data.ΓΡΑΜΜΟΓΡΑΦΗΣΗ || '',
            photo_url: data.photo_url || '',
            comments: data.comments || ''
        });

        // 2. Update Site Status
        let newStatus = 'IN_PROGRESS';
        if (data.trench_dug === 'YES' && data.cable_laid === 'YES' && data.backfill_done === 'YES') {
            newStatus = 'DIGGING_DONE';
        }

        await sheetService.updateRow('Sites', 'site_id', data.site_id, {
            status: newStatus
        });

        return reportId;
    }

    async submitAutopsyReport(data) {
        // 1. Save to Autopsy_Reports
        const reportId = `R-A-${Date.now()}`;
        await sheetService.addRow('Autopsy_Reports', {
            report_id: reportId,
            site_id: data.site_id,
            user_id: data.user_id,
            date: new Date().toISOString(),
            ΔΙΕΥΘΥΝΣΗ: data.ΔΙΕΥΘΥΝΣΗ || '',
            ΠΕΛΑΤΗ: data.ΠΕΛΑΤΗ || '',
            ΤΗΛ_ΕΠΙΚΟΙΝΩΝΙΑΣ_ΠΕΛΑΤΗ: data.ΤΗΛ_ΕΠΙΚΟΙΝΩΝΙΑΣ_ΠΕΛΑΤΗ || '',
            ΣΤΟΙΧΕΙΑ_ΔΙΑΧΕΙΡΙΣΤΗ: data.ΣΤΟΙΧΕΙΑ_ΔΙΑΧΕΙΡΙΣΤΗ || '',
            ΗΜΕΡΟΜΗΝΙΑ_ΡΑΝΤΕΒΟΥ: data.ΗΜΕΡΟΜΗΝΙΑ_ΡΑΝΤΕΒΟΥ || '',
            ΩΡΑ_ΡΑΝΤΕΒΟΥ: data.ΩΡΑ_ΡΑΝΤΕΒΟΥ || '',
            ΠΕΡΙΟΧΗ: data.ΠΕΡΙΟΧΗ || '',
            photo_url: data.photo_url || '',
            comments: data.comments || ''
        });

        // 2. Update Site Status to AUTOPSY_DONE
        await sheetService.updateRow('Sites', 'site_id', data.site_id, {
            status: 'AUTOPSY_DONE'
        });

        return reportId;
    }
}

module.exports = new ReportService();
