require('dotenv').config();
const sheetService = require('../services/sheetService');

async function resetSite() {
    console.log('Resetting test site to PENDING status...');

    const siteId = 'S-1001';
    const originalStatus = 'PENDING';

    try {
        const result = await sheetService.updateRow('Sites', 'site_id', siteId, {
            status: originalStatus
        });

        if (result) {
            console.log(`✅ Site ${siteId} reset to ${originalStatus}`);
        } else {
            console.error('❌ Failed to reset site');
        }
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

resetSite();
