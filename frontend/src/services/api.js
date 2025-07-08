import axios from 'axios';

// 🔍 디버깅 모드 설정
const DEBUG_MODE = process.env.NODE_ENV === 'development';

// 🌐 환경별 API 베이스 URL 설정
const getApiBaseUrl = () => {
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.minglingchat.com';
  } else {
    return 'http://localhost:8001';
  }
};

// ✅ Cloudflare 프록시 + HTTPS 설정
// Cloudflare Flexible SSL 모드: HTTPS → HTTP (EC2 8001 포트)
const API_BASE_URL = 'https://api.minglingchat.com';

// 🔧 환경 정보 로깅
if (DEBUG_MODE) {
  console.log('🔧 API Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    API_BASE_URL: API_BASE_URL,
    timestamp: new Date().toISOString()
  });
}

// 📊 API 요청 통계
const apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  lastError: null
};

// 🔍 안전한 로깅 함수
const safeLog = (level, message, data = {}) => {
  if (DEBUG_MODE) {
    console[level](`[API ${level.toUpperCase()}]`, message, data);
  }
  
  // 에러만 로컬 스토리지에 저장 (최대 5개)
  if (level === 'error') {
    try {
      const logs = JSON.parse(localStorage.getItem('api_error_logs') || '[]');
      logs.unshift({
        timestamp: new Date().toISOString(),
        message,
        data
      });
      localStorage.setItem('api_error_logs', JSON.stringify(logs.slice(0, 5)));
    } catch (e) {
      // 로컬 스토리지 에러 무시
    }
  }
};

// 🚨 에러 분류 함수
const classifyError = (error) => {
  if (error.message?.includes('CORS') || error.message?.includes('Network Error')) {
    return 'NETWORK_ERROR';
  } else if (error.response?.status >= 400 && error.response?.status < 500) {
    return 'CLIENT_ERROR';
  } else if (error.response?.status >= 500) {
    return 'SERVER_ERROR';
  } else {
    return 'UNKNOWN_ERROR';
  }
};

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    apiStats.totalRequests++;
    config.metadata = { startTime: Date.now() };
    
    // 인증 헤더 추가
    if (axios.defaults.headers.common['X-User-ID']) {
      config.headers['X-User-ID'] = axios.defaults.headers.common['X-User-ID'];
    }
    if (axios.defaults.headers.common['X-User-Email']) {
      config.headers['X-User-Email'] = axios.defaults.headers.common['X-User-Email'];
    }
    
    safeLog('info', '🚀 API Request', {
      method: config.method?.toUpperCase(),
      url: config.url
    });
    
    return config;
  },
  (error) => {
    apiStats.failedRequests++;
    safeLog('error', '🚨 Request Setup Error', { message: error.message });
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    const responseTime = response.config.metadata ? 
      Date.now() - response.config.metadata.startTime : 0;
    
    apiStats.successfulRequests++;
    
    safeLog('info', '✅ API Response Success', {
      status: response.status,
      url: response.config.url,
      responseTime: `${responseTime}ms`
    });
    
    return response;
  },
  (error) => {
    const responseTime = error.config?.metadata ? 
      Date.now() - error.config.metadata.startTime : 0;
    
    apiStats.failedRequests++;
    const errorType = classifyError(error);
    
    const errorInfo = {
      errorType,
      status: error.response?.status,
      url: error.config?.url,
      method: error.config?.method?.toUpperCase(),
      responseTime: `${responseTime}ms`,
      message: error.message
    };
    
    apiStats.lastError = {
      ...errorInfo,
      timestamp: new Date().toISOString()
    };
    
    safeLog('error', '🚨 API Response Error', errorInfo);
    
    // 네트워크 에러 특별 처리
    if (errorType === 'NETWORK_ERROR') {
      safeLog('warn', '🌐 Network Error - Check server connection');
    }
    
    return Promise.reject(error);
  }
);

// API 디버깅 함수
if (DEBUG_MODE) {
  window.apiDebug = {
    getStats: () => apiStats,
    getErrorLogs: () => JSON.parse(localStorage.getItem('api_error_logs') || '[]'),
    clearErrorLogs: () => localStorage.removeItem('api_error_logs')
  };
}

// Characters API
export const charactersAPI = {
  getAll: () => api.get('/api/characters'),
  getMy: () => api.get('/api/characters/my'),
  getRecommended: () => api.get('/api/characters/recommended'),
  getById: (id) => api.get(`/api/characters/${id}`),
  create: (characterData) => api.post('/api/characters', characterData),
  update: (id, characterData) => api.put(`/api/characters/${id}`, characterData),
  delete: (id) => api.delete(`/api/characters/${id}`),
  getTypes: () => api.get('/api/characters/types'),
  getHashtags: () => api.get('/api/characters/hashtags'),
};

// Personas API
export const personasAPI = {
  getAll: () => api.get('/api/personas'),
  getMy: () => api.get('/api/personas/my'),
  getById: (id) => api.get(`/api/personas/${id}`),
  create: (personaData) => api.post('/api/personas', personaData),
  update: (id, personaData) => api.put(`/api/personas/${id}`, personaData),
  delete: (id) => api.delete(`/api/personas/${id}`),
};

// Chats API
export const chatsAPI = {
  getAll: () => api.get('/api/chats'),
  getMessages: (chatId) => api.get(`/api/chats/${chatId}/messages`),
  sendMessage: (chatId, messageData) => api.post(`/api/chats/${chatId}/messages`, messageData),
  create: (chatData) => api.post('/api/chats', chatData),
};

// Users API
export const usersAPI = {
  getProfile: () => api.get('/api/users/profile'),
  updateProfile: (profileData) => api.put('/api/users/profile', profileData),
};

// Hearts API
export const heartsAPI = {
  getBalance: () => api.get('/api/hearts/balance'),
  charge: (amount) => api.post('/api/hearts/charge', { amount }),
  spend: (amount, description = '') => api.post('/api/hearts/spend', { amount, description }),
  getTransactions: () => api.get('/api/hearts/transactions'),
};

// Auth API
export const authAPI = {
  logout: () => api.post('/api/auth/logout'),
  withdraw: () => api.delete('/api/auth/withdraw'),
};

// Upload API
export const uploadAPI = {
  characterAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/api/upload/character-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  personaAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.post('/api/upload/persona-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  userProfile: (file) => {
    const formData = new FormData();
    formData.append('profile', file);
    return api.post('/api/upload/user-profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  image: (file) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post('/api/upload/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  images: (files) => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('images', file);
    });
    return api.post('/api/upload/images', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  deleteFile: (url) => api.delete('/api/upload/file', { data: { url } }),
};

export default api; 