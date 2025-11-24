// Global users cache
let allUsers = [];

// Initialize global search
document.addEventListener('DOMContentLoaded', () => {
    const searchInput = document.getElementById('global-search');
    if (searchInput && window.SearchModule) {
        const debouncedSearch = window.SearchModule.debounce((e) => {
            const searchTerm = e.target.value.trim();

            // Check active tab
            const jobsView = document.getElementById('view-jobs');
            const reportsView = document.getElementById('view-reports');

            if (!jobsView.classList.contains('hidden')) {
                // Filter jobs
                if (typeof setJobSearchTerm === 'function') {
                    setJobSearchTerm(searchTerm);
                }
            } else if (!reportsView.classList.contains('hidden')) {
                // Filter reports
                filterAndRenderReports(searchTerm);
            }
        }, 300);

        searchInput.addEventListener('input', debouncedSearch);
    }
});

function filterAndRenderReports(searchTerm) {
    if (!searchTerm) {
        renderReportsTable(allReportsCache);
        return;
    }

    if (window.SearchModule) {
        const filtered = window.SearchModule.filterReports(allReportsCache, { search: searchTerm });
        renderReportsTable(filtered);
    } else {
        // Fallback simple filter
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = allReportsCache.filter(report =>
            (report.site_name && report.site_name.toLowerCase().includes(lowerTerm)) ||
            (report.user_name && report.user_name.toLowerCase().includes(lowerTerm)) ||
            (report.type && report.type.toLowerCase().includes(lowerTerm))
        );
        renderReportsTable(filtered);
    }
}

// Tab switching
function switchTab(tab) {
    const sitesView = document.getElementById('view-sites');
    const reportsView = document.getElementById('view-reports');
    const usersView = document.getElementById('view-users');
    const jobsView = document.getElementById('view-jobs');
    const dashboardView = document.getElementById('view-dashboard');
    const sitesTab = document.getElementById('tab-sites');
    const reportsTab = document.getElementById('tab-reports');
    const usersTab = document.getElementById('tab-users');
    const jobsTab = document.getElementById('tab-jobs');
    const teamsTab = document.getElementById('tab-teams');
    const teamsView = document.getElementById('view-teams');
    const dashboardTab = document.getElementById('tab-dashboard');

    // Hide all views
    sitesView.classList.add('hidden');
    reportsView.classList.add('hidden');
    usersView.classList.add('hidden');
    jobsView.classList.add('hidden');
    if (teamsView) teamsView.classList.add('hidden');
    if (dashboardView) dashboardView.classList.add('hidden');

    // Reset all tabs
    [sitesTab, reportsTab, usersTab, jobsTab, teamsTab, dashboardTab].forEach(t => {
        if (t) {
            t.classList.remove('border-indigo-500', 'text-indigo-600');
            t.classList.add('border-transparent', 'text-gray-500');
        }
    });

    // Show selected view and activate tab
    if (tab === 'dashboard') {
        dashboardView.classList.remove('hidden');
        dashboardTab.classList.add('border-indigo-500', 'text-indigo-600');
        dashboardTab.classList.remove('border-transparent', 'text-gray-500');
        // Load dashboard and start auto-refresh
        if (window.DashboardStats) {
            window.DashboardStats.loadDashboard();
            window.DashboardStats.startDashboardRefresh(30000); // 30 seconds
        }
    } else {
        // Stop dashboard refresh when leaving dashboard
        if (window.DashboardStats) {
            window.DashboardStats.stopDashboardRefresh();
        }

        if (tab === 'sites') {
            sitesView.classList.remove('hidden');
            sitesTab.classList.add('border-indigo-500', 'text-indigo-600');
            sitesTab.classList.remove('border-transparent', 'text-gray-500');
            loadSites();
        } else if (tab === 'reports') {
            reportsView.classList.remove('hidden');
            reportsTab.classList.add('border-indigo-500', 'text-indigo-600');
            reportsTab.classList.remove('border-transparent', 'text-gray-500');
            loadReports();
        } else if (tab === 'users') {
            usersView.classList.remove('hidden');
            usersTab.classList.add('border-indigo-500', 'text-indigo-600');
            usersTab.classList.remove('border-transparent', 'text-gray-500');
            loadUsers();
        } else if (tab === 'jobs') {
            jobsView.classList.remove('hidden');
            jobsTab.classList.add('border-indigo-500', 'text-indigo-600');
            jobsTab.classList.remove('border-transparent', 'text-gray-500');
            loadJobs();
        } else if (tab === 'teams') {
            teamsView.classList.remove('hidden');
            teamsTab.classList.add('border-indigo-500', 'text-indigo-600');
            teamsTab.classList.remove('border-transparent', 'text-gray-500');
            loadJobsForSelector();
        }
    }
}

// Load sites
async function loadSites() {
    try {
        const response = await fetch('/api/sites');
        const sites = await response.json();

        const tbody = document.getElementById('sites-table-body');
        tbody.innerHTML = '';

        let pending = 0;
        let completed = 0;

        sites.forEach(site => {
            const tr = document.createElement('tr');

            // Status styling
            let statusClass = 'bg-gray-100 text-gray-800';
            if (site.status === 'COMPLETED' || site.status.includes('DONE')) {
                statusClass = 'bg-green-100 text-green-800';
                completed++;
            } else if (site.status === 'PENDING') {
                statusClass = 'bg-yellow-100 text-yellow-800';
                pending++;
            } else {
                statusClass = 'bg-blue-100 text-blue-800';
                pending++;
            }

            tr.innerHTML = `
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">${site.site_id}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 text-sm text-gray-500">${site.address}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500">${site.type}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${site.status}
                    </span>
                </td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500">${site.assigned_to || '-'}</td>
            `;
            tbody.appendChild(tr);
        });

        // Update stats (if elements exist)
        const totalSitesEl = document.getElementById('total-sites');
        const pendingSitesEl = document.getElementById('pending-sites');
        const completedSitesEl = document.getElementById('completed-sites');

        if (totalSitesEl) totalSitesEl.textContent = sites.length;
        if (pendingSitesEl) pendingSitesEl.textContent = pending;
        if (completedSitesEl) completedSitesEl.textContent = completed;

    } catch (error) {
        console.error('Error loading sites:', error);
        alert('Failed to load sites');
    }
}

// loadJobs is now handled in jobFilters.js

// Reports Management Functions
// Handled by reports-module.js

// loadUsers is now handled in users-module.js

// loadJobs is now handled in jobFilters.js

// Assign worker to site
async function assignWorker(siteId, userId) {
    try {
        const response = await fetch(`/api/sites/${siteId}/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId })
        });

        if (response.ok) {
            loadSites(); // Reload sites to show updated assignment
        } else {
            alert('Failed to assign worker');
        }
    } catch (error) {
        console.error('Error assigning worker:', error);
        alert('Failed to assign worker');
    }
}

// Jobs Management Functions
// Handled by jobs-module.js



// Load on startup
document.addEventListener('DOMContentLoaded', () => {
    loadSites();
    loadSites();
    // loadJobs() is called by initDashboard in dashboard.html
    // Load users in background for dropdown
    fetch('/api/users').then(r => r.json()).then(users => allUsers = users);
});

// Teams Management Functions
// Handled by teams-module.js


