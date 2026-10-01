// js/api.js

const API_BASE = '/api';

const getHeaders = () => {
    const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };
    // If using JWT, add Authorization header here
    // headers['Authorization'] = `Bearer ${localStorage.getItem('token')}`;
    return headers;
};

const handleResponse = async (response) => {
    if (response.status === 401) {
        window.location.href = '/login';
        throw new Error('Unauthorized');
    }
    if (response.status === 403) {
        showToast('Access Denied', 'error');
        throw new Error('Forbidden');
    }
    if (!response.ok) {
        let errorMsg = 'An error occurred';
        try {
            const err = await response.json();
            errorMsg = err.message || errorMsg;
        } catch(e) {}
        showToast(errorMsg, 'error');
        throw new Error(errorMsg);
    }
    // Check if empty response (e.g., DELETE)
    if (response.status === 204) return null;
    
    // Check if content-type is json
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.indexOf("application/json") !== -1) {
        return response.json();
    } else {
        return response.text();
    }
};

const apiGet = async (endpoint) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'GET',
        headers: getHeaders()
    });
    return handleResponse(response);
};

const apiPost = async (endpoint, data) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    return handleResponse(response);
};

const apiPut = async (endpoint, data) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(data)
    });
    return handleResponse(response);
};

const apiDelete = async (endpoint) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers: getHeaders()
    });
    return handleResponse(response);
};

const apiPatch = async (endpoint, data = null) => {
    const options = {
        method: 'PATCH',
        headers: getHeaders()
    };
    if (data) {
        options.body = JSON.stringify(data);
    }
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    return handleResponse(response);
};
