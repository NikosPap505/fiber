require('dotenv').config();
const sheetService = require('../services/sheetService');

async function testUpdate() {
    console.log('Starting update test...');

    const siteId = 'S-1001'; // Known existing site
    const newStatus = 'TEST_STATUS_' + Date.now();

    console.log(`Attempting to update site ${siteId} to status ${newStatus}`);

    try {
        const result = await sheetService.updateRow('Sites', 'site_id', siteId, {
            status: newStatus
        });

        if (result) {
            console.log('✅ Update reported success');
        } else {
            console.error('❌ Update reported failure (row not found)');
        }

        // Verify by reading back
        const rows = await sheetService.getRows('Sites', { site_id: siteId });
        if (rows.length > 0) {
            const row = rows[0];
            const currentStatus = row.get('status');
            console.log(`Current status in sheet: ${currentStatus}`);

            if (currentStatus === newStatus) {
                console.log('✅ Verification passed: Status matches');
            } else {
                console.error('❌ Verification failed: Status mismatch');
            }
        } else {
            console.error('❌ Could not find row for verification');
        }

    } catch (error) {
        console.error('❌ Error during test:', error);
    }
}

testUpdate();
