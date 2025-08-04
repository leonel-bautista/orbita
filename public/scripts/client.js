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
