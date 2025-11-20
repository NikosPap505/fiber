require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function createTeamsSheet() {
    try {
        console.log('Creating Teams sheet...');

        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        console.log('Connected to Google Sheet:', doc.title);

        // Check if Teams sheet already exists
        let teamsSheet = doc.sheetsByTitle['Teams'];

        if (teamsSheet) {
            console.log('Teams sheet already exists. Skipping creation.');
            return;
        }

        // Create Teams sheet
        teamsSheet = await doc.addSheet({
            title: 'Teams',
            headerValues: [
                'team_id',
                'job_sr_id',
                'team_type',
                'user_id',
                'user_name',
                'assigned_date',
                'status'
            ]
        });

        console.log('✅ Teams sheet created successfully!');
        console.log('Headers:', teamsSheet.headerValues);

    } catch (error) {
        console.error('Error creating Teams sheet:', error);
    }
}

createTeamsSheet();
