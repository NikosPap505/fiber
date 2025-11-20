const sheetService = require('./sheetService');

class FormStateService {
    /**
     * Save the current form state for a user
     * @param {string} chatId - Telegram chat ID
     * @param {object} state - Form state object { siteId, role, step, formData }
     */
    async saveFormState(chatId, state) {
        const existingRows = await sheetService.getRows('FormState', { chat_id: chatId });

        const stateData = {
            chat_id: chatId,
            site_id: state.siteId,
            role: state.role,
            step: state.step,
            form_data: JSON.stringify(state.formData),
            last_updated: new Date().toISOString()
        };

        if (existingRows.length > 0) {
            // Update existing state
            await sheetService.updateRow('FormState', 'chat_id', chatId, stateData);
        } else {
            // Create new state
            await sheetService.addRow('FormState', stateData);
        }
    }

    /**
     * Load saved form state for a user
     * @param {string} chatId - Telegram chat ID
     * @returns {object|null} - Form state or null if not found
     */
    async loadFormState(chatId) {
        const rows = await sheetService.getRows('FormState', { chat_id: chatId });

        if (rows.length > 0) {
            const row = rows[0];
            return {
                siteId: row.get('site_id'),
                role: row.get('role'),
                step: row.get('step'),
                formData: JSON.parse(row.get('form_data') || '{}')
            };
        }

        return null;
    }

    /**
     * Clear saved form state for a user
     * @param {string} chatId - Telegram chat ID
     */
    async clearFormState(chatId) {
        const rows = await sheetService.getRows('FormState', { chat_id: chatId });

        for (const row of rows) {
            await row.delete();
        }
    }
}

module.exports = new FormStateService();
