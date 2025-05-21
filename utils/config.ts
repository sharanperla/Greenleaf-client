export const API_BASE_URL = 'http://192.168.43.234:8000';

export const ENDPOINTS = {
    LOGIN: `${API_BASE_URL}/api/auth/login/`,
    REGISTER: `${API_BASE_URL}/api/auth/register/`,
    REFRESH: `${API_BASE_URL}/api/auth/refresh/`,
    ME: `${API_BASE_URL}/api/auth/me/`,
    PREDICT: `${API_BASE_URL}/api/data/predict/`,
    DISEASES: `${API_BASE_URL}/api/data/diseases`,
    CHAT_ROOMS: `${API_BASE_URL}/api/chat/rooms/`,
};