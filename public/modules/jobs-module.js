import { api } from './api-client.js';

// State
let allJobsCache = [];
let activeJobFilters = {};
let editingJobId = null;

// Helper: Parse dates
function parseJobDate(dateStr) {
    if (!dateStr) return null;
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        date = new Date(year, month, day);
        if (!isNaN(date.getTime())) return date;
    }
    return null;
}

// --- Core Job Functions ---

export async function loadJobs() {
    console.log('JobsModule: loadJobs called');
    try {
        const jobs = await api.get('/jobs');
        console.log('Jobs loaded:', jobs.length);

        allJobsCache = jobs;

        // Check for active filters
        const savedFilters = localStorage.getItem('jobFilters');
        if (savedFilters) {
            activeJobFilters = JSON.parse(savedFilters);
            filterAndRenderJobs();
        } else {
            renderJobsTable(jobs);
        }
    } catch (error) {
        console.error('Error loading jobs:', error);
        if (window.UIComponents) {
            window.UIComponents.showToast('Failed to load jobs', 'error');
        }
    }
}

export async function loadJobsForSelector() {
    try {
        const jobs = await api.get('/jobs');
        const selector = document.getElementById('team-job-selector');
        if (!selector) return;

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

export async function submitJob(event) {
    event.preventDefault();
    const form = event.target;
    const formData = new FormData(form);

    // Date formatting
    const dateInput = formData.get('appointment_date');
    const date = new Date(dateInput);
    const formattedDate = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;

    const assignDateInput = formData.get('assignment_date');
    const formattedAssignDate = assignDateInput ?
        (() => { const d = new Date(assignDateInput); return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`; })() :
        new Date().toLocaleDateString('en-US');

    // Helper for other dates
    const formatDate = (dStr) => {
        if (!dStr) return '';
        const d = new Date(dStr);
        return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
    };

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
        autopsy_date: formatDate(formData.get('autopsy_date')),
        digging_date: formatDate(formData.get('digging_date')),
        construction_date: formatDate(formData.get('construction_date')),
        optical_date: formatDate(formData.get('optical_date')),
        line_recording: formData.get('line_recording'),
        observations: formData.get('observations')
    };

    try {
        if (editingJobId) {
            await api.put(`/jobs/${editingJobId}`, jobData);
            alert('Job updated successfully!');
        } else {
            await api.post('/jobs', jobData);
            alert('Job added successfully!');
        }

        closeAddJobModal();
        loadJobs();
        editingJobId = null;
    } catch (error) {
        console.error('Error saving job:', error);
        alert('Failed to save job: ' + error.message);
    }
}

export async function editJob(srId) {
    try {
        const job = await api.get(`/jobs/${srId}`);
        editingJobId = srId;

        const form = document.getElementById('add-job-form');
        if (!form) return;

        // Populate form
        form.querySelector('[name="sr_id"]').value = job.sr_id || '';
        form.querySelector('[name="sr_id"]').disabled = true;
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

        // Date inputs (YYYY-MM-DD)
        const setDate = (name, val) => {
            if (val) {
                const d = new Date(val);
                if (!isNaN(d.getTime())) {
                    form.querySelector(`[name="${name}"]`).value = d.toISOString().split('T')[0];
                }
            }
        };

        setDate('assignment_date', job.assignment_date);
        setDate('appointment_date', job.appointment_date);
        setDate('autopsy_date', job.autopsy_date);
        setDate('digging_date', job.digging_date);
        setDate('construction_date', job.construction_date);
        setDate('optical_date', job.optical_date);

        if (job.appointment_time) {
            form.querySelector('[name="appointment_time"]').value = job.appointment_time;
        }

        const modalTitle = document.querySelector('#add-job-modal h3');
        if (modalTitle) modalTitle.textContent = 'Επεξεργασία Εργασίας';

        showAddJobModal();
    } catch (error) {
        console.error('Error loading job for edit:', error);
        alert('Failed to load job data');
    }
}

export async function deleteJob(srId) {
    if (!confirm(`Are you sure you want to delete job ${srId}?`)) return;

    try {
        await api.delete(`/jobs/${srId}`);
        loadJobs();
        alert('Job deleted successfully!');
    } catch (error) {
        console.error('Error deleting job:', error);
        alert('Failed to delete job');
    }
}

// --- UI Functions ---

export function showAddJobModal() {
    const modal = document.getElementById('add-job-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closeAddJobModal() {
    const modal = document.getElementById('add-job-modal');
    const form = document.getElementById('add-job-form');
    const modalTitle = document.querySelector('#add-job-modal h3');

    if (modal) modal.classList.add('hidden');
    if (form) {
        form.reset();
        const srIdField = form.querySelector('[name="sr_id"]');
        if (srIdField) srIdField.disabled = false;
    }
    if (modalTitle) modalTitle.textContent = 'Προσθήκη Νέας Εργασίας';
    editingJobId = null;
}

export function toggleExportMenu() {
    const menu = document.getElementById('export-menu');
    if (menu) menu.classList.toggle('hidden');
}

// --- Filter Functions ---

export function showJobFiltersModal() {
    const modal = document.getElementById('job-filters-modal');
    if (modal) modal.classList.remove('hidden');

    const savedFilters = localStorage.getItem('jobFilters');
    if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        if (filters.dateFrom) document.getElementById('filter-date-from').value = filters.dateFrom;
        if (filters.dateTo) document.getElementById('filter-date-to').value = filters.dateTo;
        if (filters.status) document.getElementById('filter-status').value = filters.status;
        if (filters.type) document.getElementById('filter-type').value = filters.type;
        if (filters.area) document.getElementById('filter-area').value = filters.area;
        if (filters.customer) document.getElementById('filter-customer').value = filters.customer;
    }
}

export function closeJobFiltersModal() {
    const modal = document.getElementById('job-filters-modal');
    if (modal) modal.classList.add('hidden');
}

export function clearJobFilters() {
    document.getElementById('job-filters-form').reset();
    activeJobFilters = {};
    localStorage.removeItem('jobFilters');
    loadJobs();
    closeJobFiltersModal();
    if (window.UIComponents) window.UIComponents.showToast('Filters cleared', 'info');
}

export function applyJobFilters(event) {
    event.preventDefault();
    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;
    const status = document.getElementById('filter-status').value;
    const type = document.getElementById('filter-type').value;
    const area = document.getElementById('filter-area').value.trim();
    const customer = document.getElementById('filter-customer').value.trim();

    activeJobFilters = { dateFrom, dateTo, status, type, area, customer };
    localStorage.setItem('jobFilters', JSON.stringify(activeJobFilters));
    filterAndRenderJobs();
    closeJobFiltersModal();
    if (window.UIComponents) window.UIComponents.showToast('Filters applied', 'success');
}

export function setJobSearchTerm(term) {
    activeJobFilters.search = term;
    filterAndRenderJobs();
}

function filterAndRenderJobs() {
    if (allJobsCache.length === 0) return;

    let filteredJobs = allJobsCache.filter(job => {
        // Date Range
        if (activeJobFilters.dateFrom) {
            const jobDate = parseJobDate(job.appointment_date);
            const fromDate = new Date(activeJobFilters.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            if (!jobDate || jobDate < fromDate) return false;
        }
        if (activeJobFilters.dateTo) {
            const jobDate = parseJobDate(job.appointment_date);
            const toDate = new Date(activeJobFilters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (!jobDate || jobDate > toDate) return false;
        }

        // Status
        if (activeJobFilters.status && job.status !== activeJobFilters.status) return false;

        // Type
        if (activeJobFilters.type && job.type !== activeJobFilters.type) return false;

        // Area
        if (activeJobFilters.area && !job.area?.toLowerCase().includes(activeJobFilters.area.toLowerCase())) return false;

        // Customer
        if (activeJobFilters.customer && !job.customer_name?.toLowerCase().includes(activeJobFilters.customer.toLowerCase())) return false;

        // Global Search
        if (activeJobFilters.search) {
            const searchFields = [
                job.sr_id, job.customer_name, job.address, job.area,
                job.cab, job.notes, job.customer_phone
            ].filter(Boolean).join(' ');

            if (window.SearchModule) {
                if (!window.SearchModule.fuzzySearch(activeJobFilters.search, searchFields)) return false;
            } else {
                if (!searchFields.toLowerCase().includes(activeJobFilters.search.toLowerCase())) return false;
            }
        }

        return true;
    });

    renderJobsTable(filteredJobs);
}

function renderJobsTable(jobs) {
    const tbody = document.getElementById('jobs-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';

    jobs.forEach(job => {
        const tr = document.createElement('tr');

        // Status styling
        let statusClass = 'bg-gray-100 text-gray-800';
        if (job.status === 'ΟΛΟΚΛΗΡΩΜΕΝΟ' || job.status === 'ΟΛΟΚΛΗΡΩΘΗΚΕ') {
            statusClass = 'bg-green-100 text-green-800';
        } else if (job.status === 'ΣΕ ΕΞΕΛΙΞΗ') {
            statusClass = 'bg-blue-100 text-blue-800';
        } else if (job.status === 'ΕΚΚΡΕΜΕΙ') {
            statusClass = 'bg-yellow-100 text-yellow-800';
        } else if (job.status === 'ΑΚΥΡΩΜΕΝΟ') {
            statusClass = 'bg-red-100 text-red-800';
        }

        // Type styling
        let typeClass = 'bg-gray-100 text-gray-800';
        if (job.type === 'Autopsy') typeClass = 'bg-yellow-100 text-yellow-800';
        else if (job.type === 'Digging') typeClass = 'bg-orange-100 text-orange-800';
        else if (job.type === 'Construction') typeClass = 'bg-blue-100 text-blue-800';
        else if (job.type === 'Optical') typeClass = 'bg-green-100 text-green-800';

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${job.sr_id}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${job.appointment_date || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${typeClass}">
                    ${job.type}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${job.status}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${job.customer_name || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${job.address || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div class="flex gap-2">
                    <button onclick="viewJobDetails('${job.sr_id}')" class="text-indigo-600 hover:text-indigo-900">View</button>
                    <button onclick="editJob('${job.sr_id}')" class="text-blue-600 hover:text-blue-900">Edit</button>
                    <button onclick="deleteJob('${job.sr_id}')" class="text-red-600 hover:text-red-900">Delete</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Expose to window for HTML onclick handlers
window.loadJobs = loadJobs;
window.loadJobsForSelector = loadJobsForSelector;
window.submitJob = submitJob;
window.editJob = editJob;
window.deleteJob = deleteJob;
window.showAddJobModal = showAddJobModal;
window.closeAddJobModal = closeAddJobModal;
window.toggleExportMenu = toggleExportMenu;
window.showJobFiltersModal = showJobFiltersModal;
window.closeJobFiltersModal = closeJobFiltersModal;
window.clearJobFilters = clearJobFilters;
window.applyJobFilters = applyJobFilters;
window.setJobSearchTerm = setJobSearchTerm;
