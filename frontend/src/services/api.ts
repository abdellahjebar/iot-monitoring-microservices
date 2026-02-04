import axios from 'axios';

const gatewayUrl = import.meta.env.VITE_GATEWAY_URL || '/';

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
    // Legacy / Core methods
    register: async (deviceId: string, type: string, status: string = 'OFFLINE') => {
        const response = await api.post('/devices/', {
            id: deviceId,
            type,
            status
        });
        return response.data;
    },

    getDevices: async () => {
        const response = await api.get('/devices/');
        return response.data;
    },

    getDeviceDetails: async (id: string) => {
        const response = await api.get(`/devices/${id}`);
        return response.data;
    },

    sendCommand: async (id: string, action: string) => {
        const response = await api.post(`/devices/commands/${id}`, { action });
        return response.data;
    },

    // Enterprise Provisioning & Simulation
    createDevice: (data: any) => api.post('/devices/provision', data),
    startSimulation: (id: string) => api.post(`/devices/${id}/simulation/start`),
    stopSimulation: (id: string) => api.post(`/devices/${id}/simulation/stop`),
    sabotageDevice: (id: string, type: string) => api.post(`/devices/commands/${id}`, { action: "SABOTAGE", params: { type } }),

    // Analytics & History
    getAnalytics: async (id: string, startTime?: string, endTime?: string) => {
        const response = await api.get(`/monitor/analytics/${id}`, {
            params: { start_time: startTime, end_time: endTime }
        });
        return response.data;
    },
    getHistory: async (id: string, limit: number = 100) => {
        const response = await api.get(`/monitor/history/${id}`, { params: { limit } });
        return response.data;
    },
    getDiscoveredAssets: async () => {
        const response = await api.get('/monitor/discovered');
        return response.data;
    }
};

export default api;
