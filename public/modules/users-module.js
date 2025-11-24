import { api } from './api-client.js';

// State
let allUsers = [];
let editingUserId = null;

// --- Core User Functions ---

export async function loadUsers() {
    try {
        const users = await api.get('/users');
        allUsers = users;
        renderUsersTable(users);
    } catch (error) {
        console.error('Error loading users:', error);
        if (window.UIComponents) {
            window.UIComponents.showToast('Failed to load users', 'error');
        }
    }
}

export async function editUser(userId) {
    const user = allUsers.find(u => u.user_id === userId);
    if (!user) {
        alert('User not found');
        return;
    }

    editingUserId = userId;

    const form = document.getElementById('edit-user-form');
    if (!form) return;

    // Populate form
    form.querySelector('[name="user_id"]').value = user.user_id;
    form.querySelector('[name="name"]').value = user.name;
    form.querySelector('[name="role"]').value = user.role;
    form.querySelector('[name="active"]').value = user.active ? 'true' : 'false';

    showEditUserModal();
}

export async function submitUser(event) {
    event.preventDefault();

    if (!editingUserId) return;

    const form = event.target;
    const formData = new FormData(form);

    const userData = {
        name: formData.get('name'),
        role: formData.get('role'),
        active: formData.get('active') === 'true'
    };

    try {
        await api.put(`/users/${editingUserId}`, userData);

        if (window.UIComponents) {
            window.UIComponents.showToast('User updated successfully', 'success');
        } else {
            alert('User updated successfully!');
        }

        closeEditUserModal();
        loadUsers();
    } catch (error) {
        console.error('Error updating user:', error);
        alert('Failed to update user: ' + error.message);
    }
}

// --- UI Functions ---

function renderUsersTable(users) {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    users.forEach(user => {
        const tr = document.createElement('tr');

        // Role badge color
        let roleClass = 'bg-gray-100 text-gray-800';
        if (user.role === 'ADMIN') roleClass = 'bg-purple-100 text-purple-800';
        else if (user.role === 'MANAGER') roleClass = 'bg-blue-100 text-blue-800';

        // Status badge
        // API returns 'active' as boolean or string 'YES'/'TRUE'? 
        // userController says: active: row.get('active') || 'YES'
        // But userService says: active: row.get('active') === 'TRUE'
        // Let's handle both boolean and string
        const isActive = user.active === true || user.active === 'TRUE' || user.active === 'YES';

        const statusClass = isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
        const statusText = isActive ? 'Active' : 'Inactive';

        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.role}</td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusClass}">
                    ${statusText}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.telegram_chat_id || '-'}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button onclick="editUser('${user.user_id}')" class="text-indigo-600 hover:text-indigo-900 mr-3">Edit</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

export function showEditUserModal() {
    const modal = document.getElementById('edit-user-modal');
    if (modal) modal.classList.remove('hidden');
}

export function closeEditUserModal() {
    const modal = document.getElementById('edit-user-modal');
    if (modal) modal.classList.add('hidden');
    editingUserId = null;
}

// Expose to window
window.loadUsers = loadUsers;
window.editUser = editUser;
window.submitUser = submitUser;
window.showEditUserModal = showEditUserModal;
window.closeEditUserModal = closeEditUserModal;
