// Global variables for filters
let activeJobFilters = {};
let allJobsCache = []; // Cache all jobs to filter client-side

// Helper to parse dates in M/D/Y format (e.g. "11/23/2025")
function parseJobDate(dateStr) {
    if (!dateStr) return null;

    // Try standard parsing first
    let date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    // Try parsing M/D/Y manually if standard fails
    const parts = dateStr.split('/');
    if (parts.length === 3) {
        const month = parseInt(parts[0], 10) - 1; // Months are 0-indexed
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        date = new Date(year, month, day);
        if (!isNaN(date.getTime())) return date;
    }

    console.warn('Could not parse date:', dateStr);
    return null;
}

// Job Filters Modal Functions
function showJobFiltersModal() {
    document.getElementById('job-filters-modal').classList.remove('hidden');

    // Load saved filters if any
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

function closeJobFiltersModal() {
    document.getElementById('job-filters-modal').classList.add('hidden');
}

function clearJobFilters() {
    document.getElementById('job-filters-form').reset();
    activeJobFilters = {};
    localStorage.removeItem('jobFilters');
    loadJobs(); // Reload all jobs
    closeJobFiltersModal();

    if (window.UIComponents) {
        window.UIComponents.showToast('Filters cleared', 'info');
    }
}

function applyJobFilters(event) {
    event.preventDefault();

    const dateFrom = document.getElementById('filter-date-from').value;
    const dateTo = document.getElementById('filter-date-to').value;
    const status = document.getElementById('filter-status').value;
    const type = document.getElementById('filter-type').value;
    const area = document.getElementById('filter-area').value.trim();
    const customer = document.getElementById('filter-customer').value.trim();

    activeJobFilters = {
        dateFrom,
        dateTo,
        status,
        type,
        area,
        customer
    };

    // Save to localStorage
    localStorage.setItem('jobFilters', JSON.stringify(activeJobFilters));

    // Apply filters
    filterAndRenderJobs();

    closeJobFiltersModal();

    if (window.UIComponents) {
        window.UIComponents.showToast('Filters applied', 'success');
    }
}

// Filter logic
function filterAndRenderJobs() {
    console.log('Filtering jobs...', activeJobFilters);
    console.log('Total jobs in cache:', allJobsCache.length);

    if (allJobsCache.length === 0) {
        console.warn('No jobs in cache to filter');
        return;
    }

    let filteredJobs = allJobsCache.filter(job => {
        // Date Range
        if (activeJobFilters.dateFrom) {
            const jobDate = parseJobDate(job.appointment_date);
            const fromDate = new Date(activeJobFilters.dateFrom);
            fromDate.setHours(0, 0, 0, 0);

            if (!jobDate) return false; // Invalid date in job
            if (jobDate < fromDate) return false;
        }
        if (activeJobFilters.dateTo) {
            const jobDate = parseJobDate(job.appointment_date);
            const toDate = new Date(activeJobFilters.dateTo);
            toDate.setHours(23, 59, 59, 999);

            if (!jobDate) return false; // Invalid date in job
            if (jobDate > toDate) return false;
        }

        // Status
        if (activeJobFilters.status && job.status !== activeJobFilters.status) {
            return false;
        }

        // Type
        if (activeJobFilters.type && job.type !== activeJobFilters.type) {
            return false;
        }

        // Area (fuzzy search)
        if (activeJobFilters.area && !job.area?.toLowerCase().includes(activeJobFilters.area.toLowerCase())) {
            return false;
        }

        // Customer (fuzzy search)
        if (activeJobFilters.customer && !job.customer_name?.toLowerCase().includes(activeJobFilters.customer.toLowerCase())) {
            return false;
        }

        return true;
    });

    console.log('Filtered jobs count:', filteredJobs.length);
    renderJobsTable(filteredJobs);
}

// Modify loadJobs to use cache and support filtering
async function loadJobs() {
    console.log('loadJobs called');
    try {
        const response = await fetch('/api/jobs');
        const jobs = await response.json();
        console.log('Jobs loaded from API:', jobs.length);

        // Update cache
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

// Separate render function
function renderJobsTable(jobs) {
    const tbody = document.getElementById('jobs-table-body');
    tbody.innerHTML = '';

    jobs.forEach(job => {
        const tr = document.createElement('tr');

        // Status styling
        let statusClass = 'bg-gray-100 text-gray-800';
        if (job.status === 'ΟΛΟΚΛΗΡΩΘΗΚΕ') {
            statusClass = 'bg-green-100 text-green-800';
        } else if (job.status === 'ΣΕ ΕΞΕΛΙΞΗ') {
            statusClass = 'bg-blue-100 text-blue-800';
        } else if (job.status === 'ΕΚΚΡΕΜΕΙ') {
            statusClass = 'bg-yellow-100 text-yellow-800';
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
