const BASE = '/api';

async function request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const res = await fetch(`${BASE}${endpoint}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        },
    });
    if (res.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return res;
    }
    return res;
}

export const api = {
    get:    (url)       => request(url),
    post:   (url, data) => request(url, { method: 'POST',   body: JSON.stringify(data) }),
    put:    (url, data) => request(url, { method: 'PUT',    body: JSON.stringify(data) }),
    delete: (url)       => request(url, { method: 'DELETE' }),
};
