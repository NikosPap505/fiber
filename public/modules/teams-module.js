import { api } from './api-client.js';

// State
let currentJobTeams = {
    AUTOPSY: [],
    CONSTRUCTION: [],
    DIGGING: [],
    OPTICAL: []
};

// --- Core Teams Functions ---

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

export async function loadTeamsForJob() {
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
        if (window.UIComponents) {
            window.UIComponents.showLoadingSkeleton(`team-${type}`, 'cards');
        }
    });

    try {
        const teams = await api.get(`/teams/${jobSrId}`);
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

export async function showAddMemberModal(teamType) {
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
        const users = await api.get(`/teams/available/${teamType}`);

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

export function toggleMemberType() {
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

export function closeAddMemberModal() {
    document.getElementById('add-member-modal').classList.add('hidden');
    document.getElementById('add-member-form').reset();
    // Reset to registered user view
    document.getElementById('registered-user-section').classList.remove('hidden');
    document.getElementById('custom-name-section').classList.add('hidden');
}

export async function submitAddMember(event) {
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
        await api.post('/teams', {
            job_sr_id: jobSrId,
            team_type: teamType,
            user_id: userId,
            user_name: userName,
            is_custom: memberType === 'custom'
        });

        closeAddMemberModal();
        loadTeamsForJob(); // Refresh teams
        if (window.UIComponents) {
            window.UIComponents.showToast('Member added successfully!', 'success');
        }
    } catch (error) {
        console.error('Error adding member:', error);
        if (window.UIComponents) {
            window.UIComponents.showToast('Failed to add member: ' + error.message, 'error');
        } else {
            alert('Failed to add member: ' + error.message);
        }
    }
}

export async function removeMember(teamId) {
    // Use custom confirm dialog if available, otherwise fallback to native confirm
    const confirmed = window.UIComponents
        ? await window.UIComponents.showConfirmDialog('Are you sure you want to remove this member?')
        : confirm('Are you sure you want to remove this member?');

    if (!confirmed) return;

    try {
        await api.delete(`/teams/${teamId}`);

        loadTeamsForJob(); // Refresh teams
        if (window.UIComponents) {
            window.UIComponents.showToast('Member removed successfully', 'success');
        }
    } catch (error) {
        console.error('Error removing member:', error);
        if (window.UIComponents) {
            window.UIComponents.showToast('Failed to remove member: ' + error.message, 'error');
        } else {
            alert('Failed to remove member: ' + error.message);
        }
    }
}

// Expose to window for HTML onclick handlers
window.loadJobsForSelector = loadJobsForSelector;
window.loadTeamsForJob = loadTeamsForJob;
window.showAddMemberModal = showAddMemberModal;
window.toggleMemberType = toggleMemberType;
window.closeAddMemberModal = closeAddMemberModal;
window.submitAddMember = submitAddMember;
window.removeMember = removeMember;
