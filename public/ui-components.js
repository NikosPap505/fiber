/**
 * UI Components Module
 * Reusable UI components for the Fiber Management System
 */

// Toast notification system
const toastContainer = (() => {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
})();

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - Type of toast: 'success', 'error', 'warning', 'info'
 * @param {number} duration - Duration in ms (default: 4000)
 */
function showToast(message, type = 'info', duration = 4000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const icons = {
        success: '✓',
        error: '✕',
        warning: '⚠',
        info: 'ℹ'
    };

    const titles = {
        success: 'Success',
        error: 'Error',
        warning: 'Warning',
        info: 'Info'
    };

    toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${titles[type]}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;

    toastContainer.appendChild(toast);

    // Auto remove after duration
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

/**
 * Show loading skeleton in a container
 * @param {string} containerId - ID of the container element
 * @param {string} type - Type of skeleton: 'table', 'cards', 'text'
 */
function showLoadingSkeleton(containerId, type = 'table') {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (type === 'table') {
        container.innerHTML = `
      <tr>
        <td colspan="100%">
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
          <div class="skeleton skeleton-text"></div>
        </td>
      </tr>
    `;
    } else if (type === 'cards') {
        container.innerHTML = `
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
      <div class="skeleton skeleton-card"></div>
    `;
    } else if (type === 'text') {
        container.innerHTML = `
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
      <div class="skeleton skeleton-text"></div>
    `;
    }
}

/**
 * Create a modal dialog
 * @param {string} title - Modal title
 * @param {string} content - Modal content (HTML)
 * @param {Function} onConfirm - Callback for confirm button
 * @param {Function} onCancel - Callback for cancel button
 */
function createModal(title, content, onConfirm = null, onCancel = null) {
    // Remove existing modal if any
    const existingModal = document.getElementById('dynamic-modal');
    if (existingModal) existingModal.remove();

    const modal = document.createElement('div');
    modal.id = 'dynamic-modal';
    modal.className = 'fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50';
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';

    const buttons = onConfirm ? `
    <div class="flex justify-end gap-3 mt-6">
      <button onclick="document.getElementById('dynamic-modal').remove()" 
              class="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition">
        Cancel
      </button>
      <button id="modal-confirm-btn"
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
        Confirm
      </button>
    </div>
  ` : `
    <div class="flex justify-end mt-6">
      <button onclick="document.getElementById('dynamic-modal').remove()" 
              class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
        Close
      </button>
    </div>
  `;

    modal.innerHTML = `
    <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4" onclick="event.stopPropagation()">
      <h3 class="text-xl font-semibold text-gray-900 mb-4">${title}</h3>
      <div class="text-gray-700">${content}</div>
      ${buttons}
    </div>
  `;

    document.body.appendChild(modal);

    // Close on background click
    modal.addEventListener('click', () => {
        modal.remove();
        if (onCancel) onCancel();
    });

    // Confirm button handler
    if (onConfirm) {
        const confirmBtn = document.getElementById('modal-confirm-btn');
        confirmBtn.addEventListener('click', () => {
            onConfirm();
            modal.remove();
        });
    }

    return modal;
}

/**
 * Show a confirmation dialog
 * @param {string} message - Confirmation message
 * @returns {Promise<boolean>} - Resolves to true if confirmed, false if cancelled
 */
function showConfirmDialog(message) {
    return new Promise((resolve) => {
        createModal(
            'Confirm Action',
            `<p>${message}</p>`,
            () => resolve(true),
            () => resolve(false)
        );
    });
}

/**
 * Toggle dark mode
 */
function toggleDarkMode() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);

    // Update icon if exists
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    }
}

/**
 * Initialize theme from localStorage
 */
function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);

    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
    }
}

/**
 * Format date to locale string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
function formatDate(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('el-GR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

/**
 * Format date and time to locale string
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date and time string
 */
function formatDateTime(date) {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleString('el-GR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
 */
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

// Initialize theme on load
document.addEventListener('DOMContentLoaded', initTheme);

// Export functions for use in other scripts
window.UIComponents = {
    showToast,
    showLoadingSkeleton,
    createModal,
    showConfirmDialog,
    toggleDarkMode,
    initTheme,
    formatDate,
    formatDateTime,
    debounce
};
