import { api } from './api-client.js';

// State
let allReportsCache = [];
let activeReportFilters = {
    type: 'all',
    search: ''
};

// --- Core Reports Functions ---

export async function loadReports() {
    try {
        const typeFilter = document.getElementById('report-type-filter')?.value || 'all';
        activeReportFilters.type = typeFilter;

        const response = await api.get(`/reports?type=${typeFilter}`);

        // Update cache
        allReportsCache = response;

        // Apply any active search filter
        filterAndRenderReports();

    } catch (error) {
        console.error('Error loading reports:', error);
        if (window.UIComponents) {
            window.UIComponents.showToast('Failed to load reports', 'error');
        } else {
            alert('Failed to load reports');
        }
    }
}

export function setReportSearchTerm(term) {
    activeReportFilters.search = term;
    filterAndRenderReports();
}

function filterAndRenderReports() {
    let filteredReports = allReportsCache;

    // Apply search filter
    if (activeReportFilters.search) {
        const searchTerm = activeReportFilters.search.toLowerCase();
        filteredReports = filteredReports.filter(report => {
            const searchFields = [
                report.type,
                report.site_name,
                report.site_id,
                report.user_name,
                report.user_id,
                report.comments
            ].filter(Boolean).join(' ').toLowerCase();

            if (window.SearchModule) {
                return window.SearchModule.fuzzySearch(activeReportFilters.search, searchFields);
            } else {
                return searchFields.includes(searchTerm);
            }
        });
    }

    renderReportsTable(filteredReports);
}

function renderReportsTable(reports) {
    const tbody = document.getElementById('reports-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (reports.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No reports found</td></tr>';
        return;
    }

    reports.forEach(report => {
        const tr = document.createElement('tr');

        // Type badge color
        let typeClass = '';
        if (report.type === 'Autopsy') {
            typeClass = 'bg-yellow-100 text-yellow-800';
        } else if (report.type === 'Construction') {
            typeClass = 'bg-blue-100 text-blue-800';
        } else if (report.type === 'Digging') {
            typeClass = 'bg-orange-100 text-orange-800';
        } else if (report.type === 'Optical') {
            typeClass = 'bg-green-100 text-green-800';
        }

        // Format details based on type
        let details = '';
        if (report.type === 'Autopsy') {
            details = 'Autopsy Report';
        } else if (report.type === 'Construction') {
            details = `BCP: ${report.bcp_installed}, BEP: ${report.bep_installed}, BMO: ${report.bmo_installed}`;
        } else if (report.type === 'Digging') {
            details = `Trench: ${report.trench_dug}, Cable: ${report.cable_laid}, Backfill: ${report.backfill_done}`;
        } else if (report.type === 'Optical') {
            details = `Splicing: ${report.splicing_done}`;
        }

        // Format date
        const date = new Date(report.date);
        const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString();

        // Photo cell - photo_url contains the Telegram file_id
        let photoCell = '-';
        if (report.photo_url && report.photo_url.trim() !== '') {
            photoCell = `<a href="/api/photo/${report.photo_url}" target="_blank" class="text-2xl hover:opacity-75 cursor-pointer" title="View photo">📷</a>`;
        }

        tr.innerHTML = `
            <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeClass}">
                    ${report.type}
                </span>
            </td>
            <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-900">${report.site_name || report.site_id || '-'}</td>
            <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500">${report.user_name || report.user_id || '-'}</td>
            <td class="px-3 sm:px-6 py-2 sm:py-4 text-sm text-gray-500">${details}</td>
            <td class="px-3 sm:px-6 py-2 sm:py-4 text-sm text-center">${photoCell}</td>
            <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500">${formattedDate}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Expose to window for HTML onchange handlers
window.loadReports = loadReports;
window.setReportSearchTerm = setReportSearchTerm;
