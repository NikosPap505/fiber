// Global users cache
let allUsers = [];

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

            // Debug logging
            console.log('Report:', report.report_id, 'photo_url:', report.photo_url);

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
                console.log('Photo link created for:', report.report_id);
            } else {
                console.log('No photo for report:', report.report_id);
            }

            // Comments cell (truncate if too long)
            const comments = report.comments || '-';
            const truncatedComments = comments.length > 50 ? comments.substring(0, 50) + '...' : comments;
            const commentsCell = comments !== '-'
                ? `<span title="${comments.replace(/"/g, '&quot;')}">${truncatedComments}</span>`
                : '-';

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

    } catch (error) {
        console.error('Error loading reports:', error);
        alert('Failed to load reports');
    }
}

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
                    <button onclick="editJob('${job.sr_id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
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
    const modal = document.getElementById('add-job-modal');
    if (modal) {
        modal.classList.remove('hidden');
    }
}

function closeAddJobModal() {
    const modal = document.getElementById('add-job-modal');
    const form = document.getElementById('add-job-form');
    const modalTitle = document.querySelector('#add-job-modal h3');

    if (modal) {
        modal.classList.add('hidden');
    }
    if (form) {
        form.reset();
        // Re-enable SR ID field
        const srIdField = form.querySelector('[name="sr_id"]');
        if (srIdField) srIdField.disabled = false;
    }
    if (modalTitle) {
        modalTitle.textContent = 'Προσθήκη Νέας Εργασίας';
    }

    // Reset editing mode
    editingJobId = null;
}

async function submitJob(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    // Convert date to M/D/YYYY format for Google Sheets
    const dateInput = formData.get('appointment_date');
    const date = new Date(dateInput);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    const assignDateInput = formData.get('assignment_date');
    const formattedAssignDate = assignDateInput ?
        (() => { const d = new Date(assignDateInput); return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`; })() :
        new Date().toLocaleDateString('en-US');

    const jobData = {
        sr_id: formData.get('sr_id'),
        assignment_date: formattedAssignDate,
        address: formData.get('address'),
        area: formData.get('area'),
        postal_code: formData.get('postal_code'),
        customer: formData.get('customer'),
        customer_phone: formData.get('customer_phone'),
        appointment_date: formattedDate,
        appointment_time: formData.get('appointment_time'),
        cab: formData.get('cab'),
        waiting: formData.get('waiting'),
        ττλπ: formData.get('ττλπ'),
        phase: formData.get('phase'),
        smart: formData.get('smart'),
        status: formData.get('status'),
        autopsy_date: formData.get('autopsy_date') ? (() => { const d = new Date(formData.get('autopsy_date')); return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`; })() : '',
        digging_date: formData.get('digging_date') ? (() => { const d = new Date(formData.get('digging_date')); return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`; })() : '',
        construction_date: formData.get('construction_date') ? (() => { const d = new Date(formData.get('construction_date')); return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`; })() : '',
        optical_date: formData.get('optical_date') ? (() => { const d = new Date(formData.get('optical_date')); return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`; })() : '',
        line_recording: formData.get('line_recording'),
        observations: formData.get('observations')
    };

    try {
        let response;
        if (editingJobId) {
            // Update existing job
            response = await fetch(`/api/jobs/${editingJobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });
        } else {
            // Create new job
            response = await fetch('/api/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jobData)
            });
        }

        if (response.ok) {
            closeAddJobModal();
            loadJobs();
            alert(editingJobId ? 'Job updated successfully!' : 'Job added successfully!');
            editingJobId = null; // Reset editing mode
        } else {
            const error = await response.json();
            alert('Failed to save job: ' + error.error);
        }
    } catch (error) {
        console.error('Error saving job:', error);
        alert('Failed to save job');
    }
}

// Global variable to track if we're editing
let editingJobId = null;

async function editJob(srId) {
    try {
        // Fetch job data
        const response = await fetch(`/api/jobs/${srId}`);
        const job = await response.json();

        if (!response.ok) {
            alert('Failed to load job data');
            return;
        }

        // Set editing mode
        editingJobId = srId;

        // Fill form with job data
        const form = document.getElementById('add-job-form');
        if (!form) return;

        form.querySelector('[name="sr_id"]').value = job.sr_id || '';
        form.querySelector('[name="sr_id"]').disabled = true; // Can't change SR ID
        form.querySelector('[name="address"]').value = job.address || '';
        form.querySelector('[name="area"]').value = job.area || '';
        form.querySelector('[name="postal_code"]').value = job.postal_code || '';
        form.querySelector('[name="customer"]').value = job.customer || '';
        form.querySelector('[name="customer_phone"]').value = job.customer_phone || '';
        form.querySelector('[name="cab"]').value = job.cab || '';
        form.querySelector('[name="waiting"]').value = job.waiting || '';
        form.querySelector('[name="ττλπ"]').value = job.ττλπ || '';
        form.querySelector('[name="phase"]').value = job.phase || 'Α';
        form.querySelector('[name="smart"]').value = job.smart || 'ΜΕ SMART';
        form.querySelector('[name="status"]').value = job.status || 'ΕΚΚΡΕΜΕΙ';
        form.querySelector('[name="line_recording"]').value = job.line_recording || '';
        form.querySelector('[name="observations"]').value = job.observations || '';

        // Convert dates from M/D/YYYY to YYYY-MM-DD for input[type="date"]
        if (job.assignment_date) {
            const assignDate = new Date(job.assignment_date);
            form.querySelector('[name="assignment_date"]').value = assignDate.toISOString().split('T')[0];
        }
        if (job.appointment_date) {
            const apptDate = new Date(job.appointment_date);
            form.querySelector('[name="appointment_date"]').value = apptDate.toISOString().split('T')[0];
        }
        if (job.appointment_time) {
            form.querySelector('[name="appointment_time"]').value = job.appointment_time;
        }
        if (job.autopsy_date) {
            const autopsyDate = new Date(job.autopsy_date);
            form.querySelector('[name="autopsy_date"]').value = autopsyDate.toISOString().split('T')[0];
        }
        if (job.digging_date) {
            const diggingDate = new Date(job.digging_date);
            form.querySelector('[name="digging_date"]').value = diggingDate.toISOString().split('T')[0];
        }
        if (job.construction_date) {
            const constructionDate = new Date(job.construction_date);
            form.querySelector('[name="construction_date"]').value = constructionDate.toISOString().split('T')[0];
        }
        if (job.optical_date) {
            const opticalDate = new Date(job.optical_date);
            form.querySelector('[name="optical_date"]').value = opticalDate.toISOString().split('T')[0];
        }

        // Update modal title
        const modalTitle = document.querySelector('#add-job-modal h3');
        if (modalTitle) {
            modalTitle.textContent = 'Επεξεργασία Εργασίας';
        }

        // Show modal
        showAddJobModal();
    } catch (error) {
        console.error('Error loading job for edit:', error);
        alert('Failed to load job data');
    }
}

// Toggle export menu
function toggleExportMenu() {
    const menu = document.getElementById('export-menu');
    menu.classList.toggle('hidden');
}

// Close export menu when clicking outside
document.addEventListener('click', function (event) {
    const menu = document.getElementById('export-menu');
    const button = event.target.closest('button[onclick="toggleExportMenu()"]');

    if (menu && !menu.contains(event.target) && !button) {
        menu.classList.add('hidden');
    }
});

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

// Teams Management Functions

async function loadJobsForSelector() {
    try {
        const response = await fetch('/api/jobs');
        const jobs = await response.json();

        const selector = document.getElementById('team-job-selector');
        selector.innerHTML = '<option value="">-- Select a job --</option>';

        jobs.forEach(job => {
            const option = document.createElement('option');
            option.value = job.sr_id;
            option.textContent = `${job.sr_id} - ${job.address} (${job.customer})`;
            selector.appendChild(option);
        });
    } catch (error) {
        console.error('Error loading jobs for selector:', error);
    }
}

// Global variable to track current teams state
let currentJobTeams = {
    AUTOPSY: [],
    CONSTRUCTION: [],
    DIGGING: [],
    OPTICAL: []
};

async function loadTeamsForJob() {
    const jobSrId = document.getElementById('team-job-selector').value;
    if (!jobSrId) {
        // Clear teams if no job selected
        ['autopsy', 'construction', 'digging', 'optical'].forEach(type => {
            document.getElementById(`team-${type}`).innerHTML = '<p class="text-sm text-gray-500">No members assigned</p>';
        });
        currentJobTeams = { AUTOPSY: [], CONSTRUCTION: [], DIGGING: [], OPTICAL: [] };
        return;
    }

    // Show loading skeletons
    ['autopsy', 'construction', 'digging', 'optical'].forEach(type => {
        const container = document.getElementById(`team-${type}`);
        if (window.UIComponents) {
            window.UIComponents.showLoadingSkeleton(`team-${type}`, 'cards');
        }
    });

    try {
        const response = await fetch(`/api/teams/${jobSrId}`);
        const teams = await response.json();
        currentJobTeams = teams; // Update global state

        // Render each team
        Object.keys(teams).forEach(type => {
            const containerId = `team-${type.toLowerCase()}`;
            const container = document.getElementById(containerId);
            const members = teams[type];

            // Update member count badge
            const badgeId = `badge-${type.toLowerCase()}`;
            const badge = document.getElementById(badgeId);
            if (badge) {
                const count = members.length;
                badge.textContent = `${count} member${count !== 1 ? 's' : ''}`;
            }

            if (members.length === 0) {
                container.innerHTML = '<p class="text-sm text-gray-500">No members assigned</p>';
            } else {
                container.innerHTML = members.map(member => {
                    // Generate avatar with initials
                    const initials = member.user_name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()
                        .substring(0, 2);

                    // Color based on team type
                    const avatarColors = {
                        'AUTOPSY': 'bg-yellow-500',
                        'DIGGING': 'bg-orange-500',
                        'CONSTRUCTION': 'bg-blue-500',
                        'OPTICAL': 'bg-green-500'
                    };

                    return `
                        <div class="flex items-center justify-between bg-white p-3 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-10 rounded-full ${avatarColors[type]} flex items-center justify-center text-white font-semibold text-sm">
                                    ${initials}
                                </div>
                                <div>
                                    <div class="font-medium text-gray-900">${member.user_name}</div>
                                    <div class="text-xs text-gray-500">Assigned: ${member.assigned_date}</div>
                                </div>
                            </div>
                            <button onclick="removeMember('${member.team_id}')" 
                                    class="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded transition-colors"
                                    title="Remove member">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                </svg>
                            </button>
                        </div>
                    `;
                }).join('');
            }
        });
    } catch (error) {
        console.error('Error loading teams:', error);
        if (window.UIComponents) {
            window.UIComponents.showToast('Failed to load teams', 'error');
        }
    }
}

async function showAddMemberModal(teamType) {
    const jobSrId = document.getElementById('team-job-selector').value;
    if (!jobSrId) {
        alert('Please select a job first');
        return;
    }

    document.getElementById('member-team-type').value = teamType;
    document.getElementById('add-member-modal').classList.remove('hidden');

    // Load available users for this team type
    const userSelect = document.getElementById('member-user-select');
    userSelect.innerHTML = '<option value="">Loading...</option>';

    try {
        const response = await fetch(`/api/teams/available/${teamType}`);
        const users = await response.json();

        // Filter out users already in the team
        const existingMemberIds = currentJobTeams[teamType] ? currentJobTeams[teamType].map(m => m.user_id) : [];
        const availableUsers = users.filter(user => !existingMemberIds.includes(user.user_id));

        if (availableUsers.length === 0) {
            userSelect.innerHTML = '<option value="">No available users</option>';
        } else {
            userSelect.innerHTML = '<option value="">Select a user</option>';
            availableUsers.forEach(user => {
                const option = document.createElement('option');
                option.value = user.user_id;
                option.dataset.name = user.name;
                option.textContent = user.name;
                userSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading users:', error);
        userSelect.innerHTML = '<option value="">Error loading users</option>';
    }
}

// Toggle between registered user and custom name
function toggleMemberType() {
    const memberType = document.querySelector('input[name="member_type"]:checked').value;
    const registeredSection = document.getElementById('registered-user-section');
    const customSection = document.getElementById('custom-name-section');

    if (memberType === 'registered') {
        registeredSection.classList.remove('hidden');
        customSection.classList.add('hidden');
    } else {
        registeredSection.classList.add('hidden');
        customSection.classList.remove('hidden');
    }
}

function closeAddMemberModal() {
    document.getElementById('add-member-modal').classList.add('hidden');
    document.getElementById('add-member-form').reset();
    // Reset to registered user view
    document.getElementById('registered-user-section').classList.remove('hidden');
    document.getElementById('custom-name-section').classList.add('hidden');
}

async function submitAddMember(event) {
    event.preventDefault();

    const jobSrId = document.getElementById('team-job-selector').value;
    const teamType = document.getElementById('member-team-type').value;
    const memberType = document.querySelector('input[name="member_type"]:checked').value;

    let userId, userName;

    if (memberType === 'registered') {
        const userSelect = document.getElementById('member-user-select');
        userId = userSelect.value;
        userName = userSelect.options[userSelect.selectedIndex].dataset.name;

        if (!userId) {
            if (window.UIComponents) {
                window.UIComponents.showToast('Please select a user', 'error');
            }
            return;
        }
    } else {
        // Custom name
        const customNameInput = document.getElementById('custom-member-name');
        userName = customNameInput.value.trim();
        userId = null; // No user ID for custom names

        if (!userName) {
            if (window.UIComponents) {
                window.UIComponents.showToast('Please enter a member name', 'error');
            }
            return;
        }
    }

    try {
        const response = await fetch('/api/teams', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                job_sr_id: jobSrId,
                team_type: teamType,
                user_id: userId,
                user_name: userName,
                is_custom: memberType === 'custom'
            })
        });

        if (response.ok) {
            closeAddMemberModal();
            loadTeamsForJob(); // Refresh teams
            if (window.UIComponents) {
                window.UIComponents.showToast('Member added successfully!', 'success');
            }
        } else {
            const error = await response.json();
            if (window.UIComponents) {
                window.UIComponents.showToast('Failed to add member: ' + error.error, 'error');
            } else {
                alert('Failed to add member: ' + error.error);
            }
        }
    } catch (error) {
        console.error('Error adding member:', error);
        if (window.UIComponents) {
            window.UIComponents.showToast('Failed to add member', 'error');
        } else {
            alert('Failed to add member');
        }
    }
}

async function removeMember(teamId) {
    // Use custom confirm dialog if available, otherwise fallback to native confirm
    const confirmed = window.UIComponents
        ? await window.UIComponents.showConfirmDialog('Are you sure you want to remove this member?')
        : confirm('Are you sure you want to remove this member?');

    if (!confirmed) return;

    try {
        const response = await fetch(`/api/teams/${teamId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadTeamsForJob(); // Refresh teams
            if (window.UIComponents) {
                window.UIComponents.showToast('Member removed successfully', 'success');
            }
        } else {
            const error = await response.json();
            if (window.UIComponents) {
                window.UIComponents.showToast('Failed to remove member: ' + error.error, 'error');
            } else {
                alert('Failed to remove member: ' + error.error);
            }
        }
    } catch (error) {
        console.error('Error removing member:', error);
        if (window.UIComponents) {
            window.UIComponents.showToast('Failed to remove member', 'error');
        } else {
            alert('Failed to remove member');
        }
    }
}
