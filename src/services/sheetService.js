const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

class SheetService {
    constructor() {
        this.doc = null;
    }

    async init() {
        if (this.doc) return;

        const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');
        const serviceAccountAuth = new JWT({
            email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
            key: privateKey,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        this.doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
        await this.doc.loadInfo();
        console.log(`Connected to Google Sheet: ${this.doc.title}`);
    }

    async getSheet(title) {
        await this.init();
        return this.doc.sheetsByTitle[title];
    }

    async addRow(sheetTitle, data) {
        const sheet = await this.getSheet(sheetTitle);
        console.log(`📝 Adding row to ${sheetTitle}:`, JSON.stringify(data, null, 2));
        const result = await sheet.addRow(data);
        console.log(`✅ Row added successfully to ${sheetTitle}`);
        return result;
    }

    async getRows(sheetTitle, query = {}) {
        const sheet = await this.getSheet(sheetTitle);
        const rows = await sheet.getRows();

        // Simple in-memory filtering (for small datasets this is fine)
        // For larger datasets, we might need more optimized fetching
        if (Object.keys(query).length === 0) return rows;

        return rows.filter(row => {
            for (const [key, value] of Object.entries(query)) {
                if (row.get(key) != value) return false;
            }
            return true;
        });
    }

    async updateRow(sheetTitle, lookupCol, lookupVal, updates) {
        console.log(`Updating row in ${sheetTitle}: searching for ${lookupCol}=${lookupVal}`);
        const rows = await this.getRows(sheetTitle);
        const row = rows.find(r => r.get(lookupCol) === lookupVal);

        if (row) {
            console.log(`Row found. Updating with:`, updates);
            // Use row.set() method or direct property assignment instead of Object.assign
            for (const [key, value] of Object.entries(updates)) {
                row.set(key, value);
            }
            await row.save();
            console.log('Row saved successfully');
            return true;
        }
        console.log('Row NOT found');
        return false;
    }
}

module.exports = new SheetService();
