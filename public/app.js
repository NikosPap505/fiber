// Global users cache
let allUsers = [];

// Tab switching
function switchTab(tab) {
    const sitesView = document.getElementById('view-sites');
    const reportsView = document.getElementById('view-reports');
    const usersView = document.getElementById('view-users');
    const jobsView = document.getElementById('view-jobs');
    const sitesTab = document.getElementById('tab-sites');
    const reportsTab = document.getElementById('tab-reports');
    const usersTab = document.getElementById('tab-users');
    const jobsTab = document.getElementById('tab-jobs');

    // Hide all views
    sitesView.classList.add('hidden');
    reportsView.classList.add('hidden');
    usersView.classList.add('hidden');
    jobsView.classList.add('hidden');

    // Reset all tabs
    [sitesTab, reportsTab, usersTab, jobsTab].forEach(t => {
        t.classList.remove('border-indigo-500', 'text-indigo-600');
        t.classList.add('border-transparent', 'text-gray-500');
    });

    // Show selected view and activate tab
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

        // Update stats
        document.getElementById('total-sites').textContent = sites.length;
        document.getElementById('pending-sites').textContent = pending;
        document.getElementById('completed-sites').textContent = completed;

    } catch (error) {
        console.error('Error loading sites:', error);
        alert('Failed to load sites');
    }
}

// Load reports
async function loadReports() {
    try {
        const typeFilter = document.getElementById('report-type-filter').value;
        const response = await fetch(`/api/reports?type=${typeFilter}`);
        const reports = await response.json();

        const tbody = document.getElementById('reports-table-body');
        tbody.innerHTML = '';

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

            // Photo cell
            const photoCell = report.photo_url
                ? `<a href="/api/photo/${report.photo_url}" target="_blank" class="text-2xl hover:opacity-75 cursor-pointer" title="View photo">📷</a>`
                : '-';

            // Comments cell (truncate if too long)
            const comments = report.comments || '-';
            const truncatedComments = comments.length > 50 ? comments.substring(0, 50) + '...' : comments;
            const commentsCell = comments !== '-'
                ? `<span title="${comments.replace(/"/g, '&quot;')}">${truncatedComments}</span>`
                : '-';

            tr.innerHTML = `
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">${report.report_id}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeClass}">
                        ${report.type}
                    </span>
                </td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm text-gray-500">${report.site_id}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 text-sm text-gray-500">${report.user_id}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 text-sm text-gray-500">${formattedDate}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 text-sm text-gray-500">${details}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 text-sm text-center">${photoCell}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 text-sm text-gray-500">${commentsCell}</td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error loading reports:', error);
        alert('Failed to load reports');
    }
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch('/api/users');
        const users = await response.json();
        allUsers = users; // Cache for later use

        const tbody = document.getElementById('users-table-body');
        tbody.innerHTML = '';

        users.forEach(user => {
            const tr = document.createElement('tr');

            // Role badge color
            let roleClass = 'bg-gray-100 text-gray-800';
            if (user.role === 'WORKER_CONSTRUCTION') roleClass = 'bg-blue-100 text-blue-800';
            else if (user.role === 'WORKER_DIGGING') roleClass = 'bg-orange-100 text-orange-800';
            else if (user.role === 'WORKER_OPTICAL') roleClass = 'bg-green-100 text-green-800';
            else if (user.role === 'ADMIN') roleClass = 'bg-purple-100 text-purple-800';

            const statusClass = user.active === 'YES' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

            tr.innerHTML = `
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.user_id}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 text-sm text-gray-500">${user.name}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${roleClass}">
                        ${user.role}
                    </span>
                </td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 text-sm text-gray-500">${user.telegram_chat_id || '-'}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                        ${user.active || 'YES'}
                    </span>
                </td>
            `;
            tbody.appendChild(tr);
        });

    } catch (error) {
        console.error('Error loading users:', error);
        alert('Failed to load users');
    }
}

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
async function loadJobs() {
    try {
        const response = await fetch('/api/jobs');
        const jobs = await response.json();

        const tbody = document.getElementById('jobs-table-body');
        tbody.innerHTML = '';

        jobs.forEach(job => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm">${job.sr_id}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm">${job.appointment_date || '-'}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 text-sm">${job.address}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 text-sm">${job.customer}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm">${job.customer_phone || '-'}</td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        ${job.status || 'ΕΚΚΡΕΜΕΙ'}
                    </span>
                </td>
                <td class="px-3 sm:px-6 py-2 sm:py-4 whitespace-nowrap text-sm">
                    <button onclick="deleteJob('${job.sr_id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (error) {
        console.error('Error loading jobs:', error);
        alert('Failed to load jobs');
    }
}

function showAddJobModal() {
    document.getElementById('add-job-modal').classList.remove('hidden');
}

function closeAddJobModal() {
    document.getElementById('add-job-modal').classList.add('hidden');
    document.getElementById('add-job-form').reset();
}

async function submitJob(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // Convert date to M/D/YYYY format for Google Sheets
    const dateInput = formData.get('appointment_date');
    const date = new Date(dateInput);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    const jobData = {
        sr_id: formData.get('sr_id'),
        address: formData.get('address'),
        area: formData.get('area'),
        customer: formData.get('customer'),
        customer_phone: formData.get('customer_phone'),
        appointment_date: formattedDate,
        appointment_time: formData.get('appointment_time'),
        cab: formData.get('cab'),
        waiting: formData.get('waiting')
    };

    try {
        const response = await fetch('/api/jobs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(jobData)
        });

        if (response.ok) {
            closeAddJobModal();
            loadJobs();
            alert('Job added successfully!');
        } else {
            const error = await response.json();
            alert('Failed to add job: ' + error.error);
        }
    } catch (error) {
        console.error('Error adding job:', error);
        alert('Failed to add job');
    }
}

async function deleteJob(srId) {
    if (!confirm(`Are you sure you want to delete job ${srId}?`)) {
        return;
    }

    try {
        const response = await fetch(`/api/jobs/${srId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadJobs();
            alert('Job deleted successfully!');
        } else {
            alert('Failed to delete job');
        }
    } catch (error) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job');
    }
}

// Load on startup
document.addEventListener('DOMContentLoaded', () => {
    loadSites();
    loadJobs();
    // Load users in background for dropdown
    fetch('/api/users').then(r => r.json()).then(users => allUsers = users);
});
