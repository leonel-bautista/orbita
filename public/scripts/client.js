import { request } from './utils/api.js';

export function getProfile() {
    return request('/auth/me');
}

export function register({ email, password, next = '' }) {
    return request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, next })
    });
}

export function login({ email, password, next = '' }) {
    return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, next })
    });
}

export function logout() {
    return request('/auth/logout', { method: 'POST' });
}

export function findUserByEmail(email) {
    return request('/auth/find-user', {
        method: 'POST',
        body: JSON.stringify({ email })
    });
}

export function getTableData(table, options = {}) {
    const params = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
            params.append(key, value);
        }
    });
    const query = params.toString() ? `?${params.toString()}` : '';

    return request(`/tables/${table}${query}`);
}

export function getActiveGames() {
    return getTableData('games', { status: 'active' });
}

export function searchActiveGames(name = '') {
    return getTableData('games', { status: 'active', name });
}