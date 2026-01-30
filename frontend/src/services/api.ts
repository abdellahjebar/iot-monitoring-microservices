import axios from 'axios';

const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: gatewayUrl,
});

// Automatically add token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const deviceService = {
    sendCommand: async (deviceId: string, action: string, params: any = {}) => {
        const response = await api.post(`/devices/commands/${deviceId}`, {
            action,
            params
        });
        return response.data;
    },

    getDevices: async () => {
        const response = await api.get('/devices/');
        return response.data;
    }
};

export default api;
