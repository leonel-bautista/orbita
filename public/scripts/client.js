import { request } from './utils/api.js';

export function getProfile() {
    return request('/auth/me');
}

export function register({ email, password, next = '' }) {
    return request('/auth/register', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ email, password, next })
    });
}

export function login({ email, password, next = '' }) {
    return request('/auth/login', {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ email, password, next })
    });
}

export function logout() {
    return request('/auth/logout', { method: 'POST' });
}

export function findUserBy(method, value) {
    return request(`/auth/user?check=${method}`, {
        headers: { 'Content-Type': 'application/json' },
        method: 'POST',
        body: JSON.stringify({ [method]: value })
    });
}

export function updateAccount(id, data) {
    return request(`/auth/update/${id}`, {
        method: 'PUT',
        body: data
    })
}

export function getTableData(table, options = {}) {
    const params = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
        if (value) params.append(key, value);
    });
    const query = params.toString() ? `?${params.toString()}` : '';

    return request(`/tables/${table}${query}`);
}

export function createTableData(table, data) {
    return request(`/tables/${table}/create`, {
        method: 'POST',
        body: data
    })
}

export function updateTableData(table, id, data) {
    return request(`/tables/${table}/update/${id}`, {
        method: 'PUT',
        body: data
    })
}

export function deleteTableData(table, id) {
    return request(`/tables/${table}/delete/${id}`, {
        method: 'DELETE'
    })
}

export function getActiveGames() {
    return getTableData('games', { status: 'active' });
}

export function searchActiveGames(name = '') {
    return getTableData('games', { status: 'active', name });
}