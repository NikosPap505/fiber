require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function addAuthColumns() {
    try {
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await doc.loadInfo();
        console.log('Connected to Google Sheet:', doc.title);

        const sheet = doc.sheetsByTitle['Users'];
        if (!sheet) {
            console.error('Users sheet not found!');
            return;
        }

        // Load header row
        await sheet.loadHeaderRow();
        const currentHeaders = sheet.headerValues;
        console.log('Current headers:', currentHeaders);

        // Check if username and password columns already exist
        if (!currentHeaders.includes('username')) {
            console.log('Adding username column...');
            await sheet.setHeaderRow([...currentHeaders, 'username']);
        }

        // Reload to get updated headers
        await sheet.loadHeaderRow();
        const updatedHeaders = sheet.headerValues;

        if (!updatedHeaders.includes('password')) {
            console.log('Adding password column...');
            await sheet.setHeaderRow([...updatedHeaders, 'password']);
        }

        console.log('✅ Auth columns added successfully!');
        console.log('New headers:', sheet.headerValues);

    } catch (error) {
        console.error('Error adding auth columns:', error);
    }
}

addAuthColumns();
