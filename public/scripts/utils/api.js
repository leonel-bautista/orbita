const API_URL = "https://leonel.alwaysdata.net/orbita/api";

export async function request(path, options = {}) {
    const res = await fetch(`${API_URL + path}`, {
        credentials: 'include',
        ...options,
    });
    if (res.status === 204) return null;

    const data = await res.json();

    return {
        status: res.status,
        ok: res.ok,
        body: data
    }
}