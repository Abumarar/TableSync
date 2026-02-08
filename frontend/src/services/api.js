import axios from 'axios';

const api = axios.create({
    baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

console.log('🔌 API Base URL:', api.defaults.baseURL);
console.log('🚀 VITE_API_URL:', import.meta.env.VITE_API_URL);

// Add a request interceptor to include the token if it exists
api.interceptors.request.use(
    (config) => {
        let token = null;

        if (config.useCustomerToken) {
            token = localStorage.getItem('sessionToken');
        } else {
            token = localStorage.getItem('authToken');
        }

        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
