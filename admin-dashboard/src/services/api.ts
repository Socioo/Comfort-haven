import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:3000', // Adjust if backend is on different port
});

api.interceptors.request.use((config) => {
    // TODO: Add auth token here
    return config;
});

export default api;
