import axios from 'axios';
import API_CONFIG, { API_ENDPOINTS, getAxiosConfig, getDefaultHeaders } from '../config/api';

// 🔧 환경 정보 로깅
if (API_CONFIG.enableDebug) {
  console.log('🔧 API Service 초기화:', {
    environment: API_CONFIG.environment,
    baseURL: API_CONFIG.baseURL,
    apiURL: API_CONFIG.apiURL,
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
  if (API_CONFIG.enableDebug) {
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

// Axios 인스턴스 생성 (새로운 설정 사용)
const api = axios.create(getAxiosConfig());

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    apiStats.totalRequests++;
    config.metadata = { startTime: Date.now() };
    
    // FormData 업로드 요청 감지
    const isFileUpload = config.data instanceof FormData;
    
    // 최신 헤더 정보로 업데이트
    const currentHeaders = getDefaultHeaders();
    
    if (isFileUpload) {
      // 파일 업로드의 경우 Content-Type을 설정하지 않음 (브라우저가 자동으로 multipart/form-data 설정)
      const { 'Content-Type': _, ...headersWithoutContentType } = currentHeaders;
      Object.assign(config.headers, headersWithoutContentType);
      
      // 기존 Content-Type 헤더 완전 제거
      delete config.headers['Content-Type'];
      delete config.headers['content-type'];
    } else {
      // 일반 JSON 요청은 기존대로 처리
      Object.assign(config.headers, currentHeaders);
    }
    
    safeLog('info', '🚀 API Request', {
      method: config.method?.toUpperCase(),
      url: config.url,
      contentType: config.headers['Content-Type'] || 'auto-detect',
      isFileUpload
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
if (API_CONFIG.enableDebug && typeof window !== 'undefined') {
  window.apiDebug = {
    getStats: () => apiStats,
    getErrorLogs: () => JSON.parse(localStorage.getItem('api_error_logs') || '[]'),
    clearErrorLogs: () => localStorage.removeItem('api_error_logs'),
    getConfig: () => API_CONFIG,
    getEndpoints: () => API_ENDPOINTS
  };
}

// 🔄 재시도 로직을 포함한 API 호출 함수
const apiCall = async (method, url, data = null, options = {}) => {
  const maxRetries = options.retries || 1;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const config = {
        method,
        url,
        ...options
      };
      
      if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        config.data = data;
      }
      
      const response = await api(config);
      return response;
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000; // 지수 백오프
        safeLog('warn', `🔄 API 재시도 ${attempt}/${maxRetries} (${delay}ms 후)`, {
          url,
          error: error.message
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Characters API
export const charactersAPI = {
  getAll: () => apiCall('get', API_ENDPOINTS.CHARACTERS.BASE),
  getMy: () => apiCall('get', API_ENDPOINTS.CHARACTERS.MY),
  getRecommended: () => apiCall('get', API_ENDPOINTS.CHARACTERS.RECOMMENDED),
  getById: (id) => apiCall('get', API_ENDPOINTS.CHARACTERS.BY_ID(id)),
  create: (characterData) => apiCall('post', API_ENDPOINTS.CHARACTERS.BASE, characterData),
  update: (id, characterData) => apiCall('put', API_ENDPOINTS.CHARACTERS.BY_ID(id), characterData),
  delete: (id) => apiCall('delete', API_ENDPOINTS.CHARACTERS.BY_ID(id)),
  getTypes: () => apiCall('get', API_ENDPOINTS.CHARACTERS.TYPES),
  getHashtags: () => apiCall('get', API_ENDPOINTS.CHARACTERS.HASHTAGS)
};

// Personas API
export const personasAPI = {
  getAll: () => apiCall('get', API_ENDPOINTS.PERSONAS.BASE),
  getMy: () => apiCall('get', API_ENDPOINTS.PERSONAS.MY),
  getById: (id) => apiCall('get', API_ENDPOINTS.PERSONAS.BY_ID(id)),
  create: (personaData) => apiCall('post', API_ENDPOINTS.PERSONAS.BASE, personaData),
  update: (id, personaData) => apiCall('put', API_ENDPOINTS.PERSONAS.BY_ID(id), personaData),
  delete: (id) => apiCall('delete', API_ENDPOINTS.PERSONAS.BY_ID(id))
};

// Chats API
export const chatsAPI = {
  getAll: () => apiCall('get', API_ENDPOINTS.CHATS.BASE),
  getById: (id) => apiCall('get', API_ENDPOINTS.CHATS.BY_ID(id)),
  create: (chatData) => apiCall('post', API_ENDPOINTS.CHATS.BASE, chatData),
  update: (id, chatData) => apiCall('put', API_ENDPOINTS.CHATS.BY_ID(id), chatData),
  delete: (id) => apiCall('delete', API_ENDPOINTS.CHATS.BY_ID(id)),
  getMessages: (chatId) => apiCall('get', API_ENDPOINTS.CHATS.MESSAGES(chatId)),
  sendMessage: (chatId, messageData) => apiCall('post', API_ENDPOINTS.CHATS.MESSAGES(chatId), messageData)
};

// Conversations API
export const conversationsAPI = {
  getAll: () => apiCall('get', API_ENDPOINTS.CONVERSATIONS.BASE),
  getById: (id) => apiCall('get', API_ENDPOINTS.CONVERSATIONS.BY_ID(id)),
  create: (conversationData) => apiCall('post', API_ENDPOINTS.CONVERSATIONS.BASE, conversationData),
  update: (id, conversationData) => apiCall('put', API_ENDPOINTS.CONVERSATIONS.BY_ID(id), conversationData),
  delete: (id) => apiCall('delete', API_ENDPOINTS.CONVERSATIONS.BY_ID(id))
};

// Relations/Favorability API
export const relationsAPI = {
  getAll: () => apiCall('get', API_ENDPOINTS.RELATIONS.BASE),
  getByCharacter: (characterId) => apiCall('get', API_ENDPOINTS.RELATIONS.BY_CHARACTER(characterId)),
  getHistory: (characterId, limit = 20, offset = 0) => 
    apiCall('get', `${API_ENDPOINTS.RELATIONS.HISTORY(characterId)}?limit=${limit}&offset=${offset}`),
  processEvent: (characterId, eventData) => 
    apiCall('post', API_ENDPOINTS.RELATIONS.EVENT(characterId), eventData),
  adjustScore: (characterId, adjustData) => 
    apiCall('post', API_ENDPOINTS.RELATIONS.ADJUST(characterId), adjustData)
};

// Hearts API
export const heartsAPI = {
  getBalance: () => apiCall('get', API_ENDPOINTS.HEARTS.BALANCE),
  charge: (amount) => apiCall('post', API_ENDPOINTS.HEARTS.CHARGE, { amount }),
  purchase: (purchaseData) => apiCall('post', API_ENDPOINTS.HEARTS.PURCHASE, purchaseData),
  getTransactions: () => apiCall('get', API_ENDPOINTS.HEARTS.TRANSACTIONS),
  // 하트 소모 함수 추가 (채팅 메시지 전송용)
  spend: (amount, description) => apiCall('post', API_ENDPOINTS.HEARTS.SPEND, { amount, description })
};

// Users API
export const usersAPI = {
  getMe: () => apiCall('get', API_ENDPOINTS.USERS.ME),
  update: (userData) => apiCall('put', API_ENDPOINTS.USERS.UPDATE, userData)
};

// Upload API
export const uploadAPI = {
  image: (formData) => apiCall('post', API_ENDPOINTS.UPLOAD.IMAGE, formData, {
    // Content-Type 헤더를 제거하여 브라우저가 자동으로 multipart/form-data를 설정하도록 함
  }),
  characterImage: (formData) => apiCall('post', API_ENDPOINTS.UPLOAD.CHARACTER, formData, {
    // Content-Type 헤더를 제거하여 브라우저가 자동으로 multipart/form-data를 설정하도록 함
  }),
  personaImage: (formData) => apiCall('post', API_ENDPOINTS.UPLOAD.PERSONA, formData, {
    // Content-Type 헤더를 제거하여 브라우저가 자동으로 multipart/form-data를 설정하도록 함
  }),
  userProfile: (formData) => apiCall('post', API_ENDPOINTS.UPLOAD.USER_PROFILE, formData, {
    // Content-Type 헤더를 제거하여 브라우저가 자동으로 multipart/form-data를 설정하도록 함
  })
};

// Health/Debug API
export const debugAPI = {
  health: () => apiCall('get', API_ENDPOINTS.HEALTH),
  stats: () => apiCall('get', API_ENDPOINTS.DEBUG.STATS)
};

// 기본 axios 인스턴스와 설정 내보내기
export { api as default, API_CONFIG, API_ENDPOINTS }; 