require('dotenv').config();
const sheetService = require('../services/sheetService');

async function seedData() {
    console.log('Seeding data...');

    const sites = [
        {
            site_id: 'S-1001',
            address: 'Leoforos Kifisias 100, Athens',
            area: 'Athens',
            type: 'Construction',
            status: 'PENDING',
            assigned_to: '', // User needs to assign themselves or we assign a test user
            created_at: new Date().toISOString()
        },
        {
            site_id: 'S-1002',
            address: 'Ermou 50, Athens',
            area: 'Athens',
            type: 'Optical',
            status: 'PENDING',
            assigned_to: '',
            created_at: new Date().toISOString()
        },
        {
            site_id: 'S-1003',
            address: 'Tsimiski 20, Thessaloniki',
            area: 'Thessaloniki',
            type: 'Construction',
            status: 'IN_PROGRESS',
            assigned_to: '',
            created_at: new Date().toISOString()
        }
    ];

    for (const site of sites) {
        await sheetService.addRow('Sites', site);
        console.log(`Added site: ${site.site_id}`);
    }

    console.log('✅ Seeding complete!');
}

seedData();
