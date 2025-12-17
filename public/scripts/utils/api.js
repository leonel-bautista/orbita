const API_URL = "http://api.app.test:4000";

export async function request(path, options = {}) {
    const res = await fetch(`${API_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        credentials: 'include',
        ...options
    });

    if (res.status === 204) return null;

    let data = {}
    try {
        data = await res.json();
    } catch {}

    return {
        status: res.status,
        ok: res.ok,
        body: data
    }
}