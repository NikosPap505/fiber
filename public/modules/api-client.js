/**
 * API Client for Fiber Management System
 * Centralizes all API requests with error handling and response parsing
 */

class ApiClient {
    constructor(baseUrl = '/api') {
        this.baseUrl = baseUrl;
    }

    /**
     * Generic request handler
     * @param {string} endpoint 
     * @param {object} options 
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);

            // Handle 401 Unauthorized (redirect to login if needed)
            if (response.status === 401) {
                window.location.href = '/login.html';
                return;
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error(`API Request Error (${endpoint}):`, error);
            throw error;
        }
    }

    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    async post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    async put(endpoint, body) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

export const api = new ApiClient();
