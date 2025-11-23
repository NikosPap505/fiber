/**
 * Search Module
 * Provides search and filtering functionality
 */

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait = 300) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Fuzzy search implementation
 * @param {string} searchTerm - Search term
 * @param {string} text - Text to search in
 * @returns {boolean} Whether the search term matches
 */
function fuzzySearch(searchTerm, text) {
    if (!searchTerm || !text) return false;

    const search = searchTerm.toLowerCase();
    const target = text.toLowerCase();

    // Simple contains check
    if (target.includes(search)) return true;

    // Fuzzy matching - check if all characters appear in order
    let searchIndex = 0;
    for (let i = 0; i < target.length && searchIndex < search.length; i++) {
        if (target[i] === search[searchIndex]) {
            searchIndex++;
        }
    }

    return searchIndex === search.length;
}

/**
 * Filter jobs based on criteria
 * @param {Array} jobs - Array of jobs
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered jobs
 */
function filterJobs(jobs, filters) {
    return jobs.filter(job => {
        // Search term filter
        if (filters.search) {
            const searchFields = [
                job.sr_id,
                job.customer_name,
                job.address,
                job.area,
                job.cab,
                job.notes
            ].filter(Boolean).join(' ');

            if (!fuzzySearch(filters.search, searchFields)) {
                return false;
            }
        }

        // Date range filter
        if (filters.dateFrom || filters.dateTo) {
            const jobDate = job.appointment_date ? new Date(job.appointment_date) : null;
            if (!jobDate) return false;

            if (filters.dateFrom && jobDate < new Date(filters.dateFrom)) return false;
            if (filters.dateTo && jobDate > new Date(filters.dateTo)) return false;
        }

        // Status filter
        if (filters.status && job.status !== filters.status) {
            return false;
        }

        // Type filter
        if (filters.type && job.type !== filters.type) {
            return false;
        }

        // Area filter
        if (filters.area && !fuzzySearch(filters.area, job.area || '')) {
            return false;
        }

        // Customer filter
        if (filters.customer && !fuzzySearch(filters.customer, job.customer_name || '')) {
            return false;
        }

        return true;
    });
}

/**
 * Filter reports based on criteria
 * @param {Array} reports - Array of reports
 * @param {Object} filters - Filter criteria
 * @returns {Array} Filtered reports
 */
function filterReports(reports, filters) {
    return reports.filter(report => {
        // Search term filter
        if (filters.search) {
            const searchFields = [
                report.site_name,
                report.user_name,
                report.type,
                report.notes
            ].filter(Boolean).join(' ');

            if (!fuzzySearch(filters.search, searchFields)) {
                return false;
            }
        }

        // Date range filter
        if (filters.dateFrom || filters.dateTo) {
            const reportDate = report.created_at ? new Date(report.created_at) : null;
            if (!reportDate) return false;

            if (filters.dateFrom && reportDate < new Date(filters.dateFrom)) return false;
            if (filters.dateTo && reportDate > new Date(filters.dateTo)) return false;
        }

        // Type filter
        if (filters.type && report.type !== filters.type) {
            return false;
        }

        // User filter
        if (filters.user && !fuzzySearch(filters.user, report.user_name || '')) {
            return false;
        }

        return true;
    });
}

/**
 * Save filter preset to localStorage
 * @param {string} name - Preset name
 * @param {Object} filters - Filter values
 */
function saveFilterPreset(name, filters) {
    try {
        const presets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
        presets[name] = {
            ...filters,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem('filterPresets', JSON.stringify(presets));
        return true;
    } catch (error) {
        console.error('Error saving filter preset:', error);
        return false;
    }
}

/**
 * Load filter presets from localStorage
 * @returns {Object} Filter presets
 */
function loadFilterPresets() {
    try {
        return JSON.parse(localStorage.getItem('filterPresets') || '{}');
    } catch (error) {
        console.error('Error loading filter presets:', error);
        return {};
    }
}

/**
 * Delete filter preset
 * @param {string} name - Preset name
 */
function deleteFilterPreset(name) {
    try {
        const presets = JSON.parse(localStorage.getItem('filterPresets') || '{}');
        delete presets[name];
        localStorage.setItem('filterPresets', JSON.stringify(presets));
        return true;
    } catch (error) {
        console.error('Error deleting filter preset:', error);
        return false;
    }
}

/**
 * Save recent search to localStorage
 * @param {string} searchTerm - Search term
 */
function saveRecentSearch(searchTerm) {
    if (!searchTerm || searchTerm.trim().length < 2) return;

    try {
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');

        // Remove if already exists
        const filtered = recent.filter(s => s !== searchTerm);

        // Add to beginning
        filtered.unshift(searchTerm);

        // Keep only last 10
        const limited = filtered.slice(0, 10);

        localStorage.setItem('recentSearches', JSON.stringify(limited));
    } catch (error) {
        console.error('Error saving recent search:', error);
    }
}

/**
 * Get recent searches from localStorage
 * @returns {Array} Recent searches
 */
function getRecentSearches() {
    try {
        return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    } catch (error) {
        console.error('Error loading recent searches:', error);
        return [];
    }
}

/**
 * Clear recent searches
 */
function clearRecentSearches() {
    try {
        localStorage.removeItem('recentSearches');
        return true;
    } catch (error) {
        console.error('Error clearing recent searches:', error);
        return false;
    }
}

// Export functions
window.SearchModule = {
    debounce,
    fuzzySearch,
    filterJobs,
    filterReports,
    saveFilterPreset,
    loadFilterPresets,
    deleteFilterPreset,
    saveRecentSearch,
    getRecentSearches,
    clearRecentSearches
};
