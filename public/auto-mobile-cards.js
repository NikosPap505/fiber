// Optimized Mobile Cards Generator
// Generic, performant, maintainable solution for all tables

(function () {
    'use strict';

    // ============================================
    // CONFIGURATION
    // ============================================

    const TABLE_CONFIGS = {
        jobs: {
            tableSelector: '#jobs-table-body',  // Direct tbody ID
            containerSelector: '#jobs-mobile-cards',
            cardClass: 'job-card',
            minColumns: 6,
            columns: [
                { index: 0, key: 'id', label: null, isTitle: true },
                { index: 1, key: 'date', label: 'Date' },
                { index: 2, key: 'type', label: 'Type', isBadge: true, badgeType: 'type' },
                { index: 3, key: 'status', label: null, isBadge: true, badgeType: 'status', isHeaderBadge: true },
                { index: 4, key: 'customer', label: 'Customer' },
                { index: 5, key: 'address', label: 'Address' }
            ],
            actions: [
                { label: 'Edit', class: 'btn-primary', onclick: 'editJob' },
                { label: 'Delete', class: 'btn-danger', onclick: 'deleteJob' }
            ]
        },
        users: {
            tableSelector: '#users-table-body',  // Direct tbody ID
            containerSelector: '#users-mobile-cards',
            cardClass: 'user-card',
            minColumns: 5,
            columns: [
                { index: 0, key: 'name', label: null, isTitle: true },
                { index: 1, key: 'role', label: 'Role' },
                { index: 2, key: 'status', label: null, isBadge: true, badgeType: 'status', isHeaderBadge: true },
                { index: 3, key: 'telegramId', label: 'Telegram ID' }
            ],
            actions: [
                { label: 'Edit', class: 'btn-primary', onclick: 'editUser', extractId: true }
            ]
        },
        sites: {
            tableSelector: '#sites-table-body',  // Direct tbody ID
            containerSelector: '#sites-mobile-cards',
            cardClass: 'site-card',
            minColumns: 5,
            columns: [
                { index: 0, key: 'id', label: null, isTitle: true },
                { index: 1, key: 'address', label: 'Address' },
                { index: 2, key: 'type', label: 'Type', isBadge: true, badgeType: 'type' },
                { index: 3, key: 'status', label: null, isBadge: true, badgeType: 'status', isHeaderBadge: true },
                { index: 4, key: 'assignedTo', label: 'Assigned To' }
            ]
        },
        reports: {
            tableSelector: '#reports-table-body',  // Direct tbody ID
            containerSelector: '#reports-mobile-cards',
            cardClass: 'report-card',
            minColumns: 6,
            columns: [
                { index: 1, key: 'siteName', label: null, isTitle: true },
                { index: 0, key: 'type', label: null, isBadge: true, badgeType: 'type', isHeaderBadge: true },
                { index: 2, key: 'user', label: 'User' },
                { index: 3, key: 'details', label: 'Details' },
                { index: 4, key: 'photo', label: 'Photo' },
                { index: 5, key: 'date', label: 'Date' }
            ]
        },
        teams: {
            tableSelector: '#teams-grid', // Grid container for teams
            containerSelector: '#teams-mobile-cards',
            cardClass: 'team-card',
            minColumns: 0,
            columns: []
        }
    };

    // ============================================
    // UTILITIES
    // ============================================

    function debounce(func, wait) {
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

    function getBadgeClass(value, type) {
        if (!value) return 'badge-pending';

        const val = value.toLowerCase();

        if (type === 'status') {
            if (val.includes('ολοκληρωμενο') || val.includes('ολοκληρωθηκε') ||
                val.includes('completed') || val.includes('done')) {
                return 'badge-completed';
            }
            if (val.includes('εξελιξη') || val.includes('progress')) {
                return 'badge-in-progress';
            }
            if (val.includes('ακυρωμενο') || val.includes('cancelled') ||
                val.includes('inactive') || val.includes('ανενεργοσ')) {
                return 'badge-cancelled';
            }
            return 'badge-pending';
        }

        if (type === 'type') {
            if (val.includes('digging')) return 'badge-digging';
            if (val.includes('construction')) return 'badge-construction';
            if (val.includes('optical')) return 'badge-optical';
            return 'badge-autopsy';
        }

        return 'badge-pending';
    }

    function extractCellValue(cell, column) {
        if (!cell) return '-';

        // Check for span (badges)
        if (column.isBadge) {
            const span = cell.querySelector('span');
            return span ? span.textContent.trim() : cell.textContent.trim();
        }

        // Check for link (photos)
        if (column.key === 'photo') {
            const link = cell.querySelector('a');
            return link ? link.textContent.trim() : cell.textContent.trim();
        }

        return cell.textContent.trim();
    }

    // ============================================
    // CARD GENERATION
    // ============================================

    function generateCard(row, config) {
        const cells = row.querySelectorAll('td');
        if (cells.length < config.minColumns) return '';

        // Extract data
        const data = {};
        let titleValue = '';
        let headerBadge = '';

        config.columns.forEach(col => {
            const value = extractCellValue(cells[col.index], col);
            data[col.key] = value;

            if (col.isTitle) {
                titleValue = value;
            }

            if (col.isHeaderBadge && col.isBadge) {
                const badgeClass = getBadgeClass(value, col.badgeType);
                headerBadge = `<span class="card-badge ${badgeClass}">${value}</span>`;
            }
        });

        // Build card HTML
        let html = `<div class="${config.cardClass}">`;

        // Header
        html += `<div class="card-header">
            <div class="card-title">${titleValue}</div>
            ${headerBadge}
        </div>`;

        // Body
        html += '<div class="card-body">';
        config.columns.forEach(col => {
            if (col.label && !col.isTitle && !col.isHeaderBadge) {
                const value = data[col.key];
                let displayValue = value;

                if (col.isBadge) {
                    const badgeClass = getBadgeClass(value, col.badgeType);
                    displayValue = `<span class="card-badge ${badgeClass}">${value}</span>`;
                }

                html += `<div class="card-field">
                    <span class="card-label">${col.label}</span>
                    <span class="card-value">${displayValue}</span>
                </div>`;
            }
        });
        html += '</div>';

        // Actions
        if (config.actions) {
            html += '<div class="card-actions">';
            config.actions.forEach(action => {
                let idValue = data.id || titleValue;

                // Extract ID from button if needed
                if (action.extractId) {
                    const actionCell = cells[cells.length - 1];
                    const btn = actionCell?.querySelector(`button[onclick*="${action.onclick}"]`);
                    const match = btn?.getAttribute('onclick')?.match(/'([^']+)'/);
                    idValue = match ? match[1] : idValue;
                }

                if (idValue && idValue !== '-') {
                    html += `<button onclick="${action.onclick}('${idValue}')" class="${action.class}">${action.label}</button>`;
                }
            });
            html += '</div>';
        }

        html += '</div>';
        return html;
    }

    function generateCardsForTable(tableName) {
        const config = TABLE_CONFIGS[tableName];
        if (!config) return;

        const table = document.querySelector(config.tableSelector);
        const container = document.querySelector(config.containerSelector);

        if (!table || !container) {
            console.warn(`Mobile cards: Table or container not found for ${tableName}`);
            return;
        }

        const rows = table.querySelectorAll('tr');
        let cardsHTML = '';

        rows.forEach(row => {
            cardsHTML += generateCard(row, config);
        });

        container.innerHTML = cardsHTML || '<div class="empty-state"><p>No items found</p></div>';
    }

    function generateAllCards() {
        Object.keys(TABLE_CONFIGS).forEach(tableName => {
            generateCardsForTable(tableName);
        });
    }

    // ============================================
    // LAZY LOADING (Only active tab)
    // ============================================

    function getActiveView() {
        const views = ['view-jobs', 'view-sites', 'view-reports', 'view-users'];
        for (const viewId of views) {
            const view = document.getElementById(viewId);
            if (view && !view.classList.contains('hidden')) {
                return viewId.replace('view-', '');
            }
        }
        return null;
    }

    function updateActiveView() {
        const activeView = getActiveView();
        if (activeView && TABLE_CONFIGS[activeView]) {
            generateCardsForTable(activeView);
        }
    }

    // ============================================
    // MUTATION OBSERVER (Debounced)
    // ============================================

    const debouncedUpdate = debounce(updateActiveView, 100);

    const observer = new MutationObserver(debouncedUpdate);

    function startObserving() {
        document.querySelectorAll('tbody').forEach(tbody => {
            observer.observe(tbody, {
                childList: true,
                subtree: true
            });
        });
    }

    // ============================================
    // INITIALIZATION
    // ============================================

    function init() {
        // Generate cards for all tables initially
        generateAllCards();

        // Start observing for changes
        startObserving();

        console.log('✅ Optimized mobile cards initialized');
    }

    // Start when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Expose for manual refresh
    window.refreshMobileCards = generateAllCards;
    window.refreshActiveView = updateActiveView;

})();
