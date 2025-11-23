/**
 * Notifications Module
 * Handles in-app notifications
 */

/**
 * Notification types
 */
const NotificationType = {
    TEAM_ASSIGNMENT: 'team_assignment',
    JOB_UPDATE: 'job_update',
    JOB_CREATED: 'job_created',
    REPORT_SUBMITTED: 'report_submitted'
};

/**
 * Get all notifications from localStorage
 * @returns {Array} Array of notifications
 */
function getNotifications() {
    try {
        const notifications = localStorage.getItem('notifications');
        return notifications ? JSON.parse(notifications) : [];
    } catch (error) {
        console.error('Error loading notifications:', error);
        return [];
    }
}

/**
 * Add a new notification
 * @param {Object} notification - Notification object
 * @param {string} notification.type - Notification type
 * @param {string} notification.title - Notification title
 * @param {string} notification.message - Notification message
 * @param {Object} notification.data - Additional data
 */
function addNotification({ type, title, message, data = {} }) {
    try {
        const notifications = getNotifications();

        const newNotification = {
            id: Date.now().toString(),
            type,
            title,
            message,
            data,
            read: false,
            createdAt: new Date().toISOString()
        };

        notifications.unshift(newNotification);

        // Keep only last 50 notifications
        const limited = notifications.slice(0, 50);

        localStorage.setItem('notifications', JSON.stringify(limited));

        // Update badge count
        updateNotificationBadge();

        // Show toast if UIComponents is available
        if (window.UIComponents) {
            window.UIComponents.showToast(title, 'info');
        }

        return newNotification;
    } catch (error) {
        console.error('Error adding notification:', error);
        return null;
    }
}

/**
 * Mark notification as read
 * @param {string} notificationId - Notification ID
 */
function markAsRead(notificationId) {
    try {
        const notifications = getNotifications();
        const notification = notifications.find(n => n.id === notificationId);

        if (notification) {
            notification.read = true;
            localStorage.setItem('notifications', JSON.stringify(notifications));
            updateNotificationBadge();
        }
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

/**
 * Mark all notifications as read
 */
function markAllAsRead() {
    try {
        const notifications = getNotifications();
        notifications.forEach(n => n.read = true);
        localStorage.setItem('notifications', JSON.stringify(notifications));
        updateNotificationBadge();
    } catch (error) {
        console.error('Error marking all as read:', error);
    }
}

/**
 * Delete a notification
 * @param {string} notificationId - Notification ID
 */
function deleteNotification(notificationId) {
    try {
        let notifications = getNotifications();
        notifications = notifications.filter(n => n.id !== notificationId);
        localStorage.setItem('notifications', JSON.stringify(notifications));
        updateNotificationBadge();
        renderNotifications();
    } catch (error) {
        console.error('Error deleting notification:', error);
    }
}

/**
 * Clear all notifications
 */
function clearAllNotifications() {
    try {
        localStorage.removeItem('notifications');
        updateNotificationBadge();
        renderNotifications();
    } catch (error) {
        console.error('Error clearing notifications:', error);
    }
}

/**
 * Get unread count
 * @returns {number} Number of unread notifications
 */
function getUnreadCount() {
    const notifications = getNotifications();
    return notifications.filter(n => !n.read).length;
}

/**
 * Update notification badge
 */
function updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    const count = getUnreadCount();

    if (badge) {
        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('hidden');
        } else {
            badge.classList.add('hidden');
        }
    }
}

/**
 * Render notifications in dropdown
 */
function renderNotifications() {
    const container = document.getElementById('notifications-list');
    if (!container) return;

    const notifications = getNotifications();

    if (notifications.length === 0) {
        container.innerHTML = '<div class="p-4 text-center text-gray-500 text-sm">No notifications</div>';
        return;
    }

    container.innerHTML = notifications.map(notification => {
        const icon = {
            team_assignment: '👥',
            job_update: '📝',
            job_created: '✨',
            report_submitted: '📋'
        }[notification.type] || '🔔';

        const timeAgo = getTimeAgo(new Date(notification.createdAt));

        return `
            <div class="notification-item ${notification.read ? 'read' : 'unread'} p-3 hover:bg-gray-50 border-b cursor-pointer"
                 onclick="window.NotificationsModule.markAsRead('${notification.id}')">
                <div class="flex items-start gap-3">
                    <span class="text-2xl">${icon}</span>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between gap-2">
                            <p class="font-medium text-sm ${notification.read ? 'text-gray-600' : 'text-gray-900'}">
                                ${notification.title}
                            </p>
                            <button onclick="event.stopPropagation(); window.NotificationsModule.deleteNotification('${notification.id}')"
                                    class="text-gray-400 hover:text-red-500 text-xs">
                                ✕
                            </button>
                        </div>
                        <p class="text-xs text-gray-500 mt-1">${notification.message}</p>
                        <p class="text-xs text-gray-400 mt-1">${timeAgo}</p>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Toggle notifications dropdown
 */
function toggleNotificationsDropdown() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        if (!dropdown.classList.contains('hidden')) {
            renderNotifications();
        }
    }
}

/**
 * Get time ago string
 * @param {Date} date - Date to compare
 * @returns {string} Time ago string
 */
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString('el-GR');
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    updateNotificationBadge();

    // Close dropdown when clicking outside
    document.addEventListener('click', (event) => {
        const dropdown = document.getElementById('notifications-dropdown');
        const button = event.target.closest('#notification-bell');

        if (dropdown && !dropdown.contains(event.target) && !button) {
            dropdown.classList.add('hidden');
        }
    });
});

// Export functions
window.NotificationsModule = {
    NotificationType,
    getNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getUnreadCount,
    updateNotificationBadge,
    renderNotifications,
    toggleNotificationsDropdown
};
