const API_URL = "http://api.app.test:4000";

export async function request(path, options = {}){
    const res = await fetch(`${API_URL}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        },
        credentials: 'include',
        ...options
    });

    if (res.status === 401){
        return null;
    }

    if (!res.ok){
        let payload = {};
        try { payload = await res.json(); } catch {}
        const err = new Error(payload.error || payload.message || 'API Error');
        err.detail = payload;
        throw err;
    }

    if (res.status === 204) return null;

    return res.json();
}