require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

async function initSheet() {
    console.log('Initializing Google Sheet...');

    let privateKey = process.env.GOOGLE_PRIVATE_KEY;
    if (!privateKey) {
        throw new Error('GOOGLE_PRIVATE_KEY is missing from .env');
    }

    // Fix key formatting: replace literal \n with actual newlines if needed
    // and ensure it has the correct headers if they are missing (though usually they are part of the string)
    privateKey = privateKey.replace(/\\n/g, '\n');

    const serviceAccountAuth = new JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: privateKey,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);

    try {
        await doc.loadInfo();
        console.log(`Connected to sheet: ${doc.title}`);

        // Define schemas
        const schemas = {
            'Sites': ['site_id', 'address', 'area', 'type', 'status', 'assigned_to', 'created_at'],
            'Users': ['user_id', 'name', 'role', 'telegram_chat_id', 'active'],
            'Autopsy_Reports': [
                'report_id', 'site_id', 'user_id', 'date',
                'ΔΙΕΥΘΥΝΣΗ', 'ΠΕΛΑΤΗ', 'ΤΗΛ_ΕΠΙΚΟΙΝΩΝΙΑΣ_ΠΕΛΑΤΗ',
                'ΣΤΟΙΧΕΙΑ_ΔΙΑΧΕΙΡΙΣΤΗ', 'ΗΜΕΡΟΜΗΝΙΑ_ΡΑΝΤΕΒΟΥ', 'ΩΡΑ_ΡΑΝΤΕΒΟΥ',
                'ΠΕΡΙΟΧΗ', 'photo_url', 'comments'
            ],
            'Construction_Reports': [
                'report_id', 'site_id', 'user_id', 'date',
                'bcp_installed', 'bep_installed', 'bmo_installed',
                'ΤΗΛ_ΕΠΙΚΟΙΝΩΝΙΑΣ_ΠΕΛΑΤΗ', 'ΩΡΑ_ΡΑΝΤΕΒΟΥ',
                'photo_url', 'comments'
            ],
            'Optical_Reports': [
                'report_id', 'site_id', 'user_id', 'date',
                'splicing_done', 'measurements',
                'CAB', 'ΑΝΑΜΟΝΗ', 'ΓΡΑΜΜΟΓΡΑΦΗΣΗ',
                'photo_url', 'comments'
            ],
            'Digging_Reports': [
                'report_id', 'site_id', 'user_id', 'date',
                'trench_dug', 'cable_laid', 'backfill_done',
                'CAB', 'ΑΝΑΜΟΝΗ', 'ΓΡΑΜΜΟΓΡΑΦΗΣΗ',
                'photo_url', 'comments'
            ],
            'FormState': ['chat_id', 'site_id', 'role', 'step', 'form_data', 'last_updated']
        };

        for (const [title, headers] of Object.entries(schemas)) {
            let sheet = doc.sheetsByTitle[title];
            if (!sheet) {
                console.log(`Creating sheet: ${title}`);
                sheet = await doc.addSheet({ title, headerValues: headers });
            } else {
                console.log(`Sheet ${title} already exists. Updating headers...`);
                await sheet.setHeaderRow(headers);
            }
        }

        console.log('✅ Database initialization complete!');
    } catch (error) {
        console.error('❌ Error initializing sheet:', error);
    }
}

initSheet();
