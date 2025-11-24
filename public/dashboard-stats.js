/**
 * Dashboard Statistics Module
 * Handles loading and displaying statistics with charts
 */

let statsRefreshInterval = null;

/**
 * Load and display overview statistics
 */
async function loadOverviewStats() {
    try {
        const response = await fetch('/api/stats/overview');

        if (!response.ok) {
            console.warn('Failed to load overview stats:', response.status);
            return;
        }

        const stats = await response.json();

        // Update stat cards
        document.getElementById('stat-total-jobs').textContent = stats.totalJobs || 0;
        document.getElementById('stat-pending-jobs').textContent = stats.pendingJobs || 0;
        document.getElementById('stat-inprogress-jobs').textContent = stats.inProgressJobs || 0;
        document.getElementById('stat-completed-jobs').textContent = stats.completedJobs || 0;

    } catch (error) {
        console.error('Error loading overview stats:', error);
    }
}

/**
 * Load and display jobs by status chart
 */
async function loadJobsByStatusChart() {
    try {
        const response = await fetch('/api/stats/jobs-by-status');

        if (!response.ok) {
            console.warn('Failed to load jobs by status:', response.status);
            return;
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.warn('Invalid data format for jobs by status');
            return;
        }

        const ctx = document.getElementById('chart-jobs-by-status');
        if (!ctx) return;

        // Destroy existing chart if any
        if (window.jobsByStatusChart) {
            window.jobsByStatusChart.destroy();
        }

        window.jobsByStatusChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.status),
                datasets: [{
                    data: data.map(d => d.count),
                    backgroundColor: [
                        '#F59E0B', // Warning - ΕΚΚΡΕΜΕΙ
                        '#3B82F6', // Info - In Progress
                        '#10B981', // Success - ΟΛΟΚΛΗΡΩΜΕΝΟ
                        '#EF4444', // Error - Other
                    ],
                    borderWidth: 2,
                    borderColor: '#FFFFFF'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 15,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading jobs by status chart:', error);
    }
}

/**
 * Load and display jobs by type chart
 */
async function loadJobsByTypeChart() {
    try {
        const response = await fetch('/api/stats/jobs-by-type');

        if (!response.ok) {
            console.warn('Failed to load jobs by type:', response.status);
            return;
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.warn('Invalid data format for jobs by type');
            return;
        }

        const ctx = document.getElementById('chart-jobs-by-type');
        if (!ctx) return;

        // Destroy existing chart if any
        if (window.jobsByTypeChart) {
            window.jobsByTypeChart.destroy();
        }

        window.jobsByTypeChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.type),
                datasets: [{
                    label: 'Number of Jobs',
                    data: data.map(d => d.count),
                    backgroundColor: [
                        '#F59E0B', // Autopsy
                        '#F97316', // Digging
                        '#3B82F6', // Construction
                        '#10B981', // Optical
                    ],
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14
                        },
                        bodyFont: {
                            size: 13
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading jobs by type chart:', error);
    }
}

/**
 * Load and display team workload chart
 */
async function loadTeamWorkloadChart() {
    try {
        const response = await fetch('/api/stats/team-workload');

        if (!response.ok) {
            console.warn('Failed to load team workload:', response.status);
            return;
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.warn('Invalid data format for team workload');
            return;
        }

        const ctx = document.getElementById('chart-team-workload');
        if (!ctx) return;

        // Destroy existing chart if any
        if (window.teamWorkloadChart) {
            window.teamWorkloadChart.destroy();
        }

        window.teamWorkloadChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.team),
                datasets: [{
                    label: 'Active Jobs',
                    data: data.map(d => d.count),
                    backgroundColor: [
                        '#F59E0B', // AUTOPSY
                        '#F97316', // DIGGING
                        '#3B82F6', // CONSTRUCTION
                        '#10B981', // OPTICAL
                    ],
                    borderRadius: 8,
                    borderSkipped: false,
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12
                    }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    y: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading team workload chart:', error);
    }
}

/**
 * Load and display jobs timeline chart
 */
async function loadJobsTimelineChart() {
    try {
        const response = await fetch('/api/stats/timeline');

        if (!response.ok) {
            console.warn('Failed to load jobs timeline:', response.status);
            return;
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            console.warn('Invalid data format for jobs timeline');
            return;
        }

        const ctx = document.getElementById('chart-jobs-timeline');
        if (!ctx) return;

        // Destroy existing chart if any
        if (window.jobsTimelineChart) {
            window.jobsTimelineChart.destroy();
        }

        window.jobsTimelineChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => {
                    const date = new Date(d.date);
                    return date.toLocaleDateString('el-GR', { month: 'short', day: 'numeric' });
                }),
                datasets: [{
                    label: 'Appointments',
                    data: data.map(d => d.count),
                    borderColor: '#4F46E5',
                    backgroundColor: 'rgba(79, 70, 229, 0.1)',
                    fill: true,
                    tension: 0.4,
                    borderWidth: 2,
                    pointRadius: 3,
                    pointHoverRadius: 5,
                    pointBackgroundColor: '#4F46E5',
                    pointBorderColor: '#FFFFFF',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        callbacks: {
                            title: function (context) {
                                const index = context[0].dataIndex;
                                const date = new Date(data[index].date);
                                return date.toLocaleDateString('el-GR', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                });
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading jobs timeline chart:', error);
    }
}

/**
 * Load all dashboard statistics and charts
 */
async function loadDashboard() {
    // Load overview stats first
    await loadOverviewStats();

    // Small delay to ensure session is fully established
    await new Promise(resolve => setTimeout(resolve, 100));

    // Load charts sequentially with small delays
    await loadJobsByStatusChart();
    await new Promise(resolve => setTimeout(resolve, 50));

    await loadJobsByTypeChart();
    await new Promise(resolve => setTimeout(resolve, 50));

    await loadTeamWorkloadChart();
    await new Promise(resolve => setTimeout(resolve, 50));

    await loadJobsTimelineChart();
}

/**
 * Start auto-refresh for dashboard
 * @param {number} interval - Refresh interval in milliseconds (default: 30000 = 30 seconds)
 */
function startDashboardRefresh(interval = 30000) {
    // Clear existing interval if any
    if (statsRefreshInterval) {
        clearInterval(statsRefreshInterval);
    }

    // Set new interval
    statsRefreshInterval = setInterval(() => {
        console.log('Auto-refreshing dashboard...');
        loadDashboard();
    }, interval);
}

/**
 * Stop auto-refresh
 */
function stopDashboardRefresh() {
    if (statsRefreshInterval) {
        clearInterval(statsRefreshInterval);
        statsRefreshInterval = null;
    }
}

// Export functions
window.DashboardStats = {
    loadDashboard,
    loadOverviewStats,
    loadJobsByStatusChart,
    loadJobsByTypeChart,
    loadTeamWorkloadChart,
    loadJobsTimelineChart,
    startDashboardRefresh,
    stopDashboardRefresh
};
