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

// 🔄 재시도 로직을 포함한 API 호출 함수 (최적화됨)
const apiCall = async (method, url, data = null, options = {}) => {
  const maxRetries = options.retries || 3; // 재시도 횟수 증가
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const config = {
        method,
        url,
        timeout: options.timeout || 15000, // 타임아웃 증가
        ...options
      };
      
      if (data && ['post', 'put', 'patch'].includes(method.toLowerCase())) {
        config.data = data;
      }
      
      const response = await api(config);
      
      // 성공 시 이전 에러 클리어
      if (attempt > 1) {
        safeLog('info', `✅ API 호출 성공 (${attempt}번째 시도)`, { url });
      }
      
      return response;
    } catch (error) {
      lastError = error;
      
      // 특정 에러는 재시도하지 않음
      if (error.response?.status === 401 || error.response?.status === 403) {
        safeLog('error', '🚫 인증 에러 - 재시도 중단', { url, status: error.response.status });
        break;
      }
      
      if (attempt < maxRetries) {
        const delay = Math.min(Math.pow(2, attempt - 1) * 1000, 5000); // 최대 5초 제한
        safeLog('warn', `🔄 API 재시도 ${attempt}/${maxRetries} (${delay}ms 후)`, {
          url,
          error: error.message,
          status: error.response?.status
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        safeLog('error', '❌ 모든 재시도 실패', { url, attempts: maxRetries });
      }
    }
  }
  
  throw lastError;
};

// Characters API (최적화됨)
export const charactersAPI = {
  getAll: () => apiCall('get', API_ENDPOINTS.CHARACTERS.BASE, null, { timeout: 15000 }),
  getMy: () => apiCall('get', API_ENDPOINTS.CHARACTERS.MY, null, { timeout: 10000 }),
  getRecommended: () => apiCall('get', API_ENDPOINTS.CHARACTERS.RECOMMENDED, null, { timeout: 15000 }),
  getById: (id) => apiCall('get', API_ENDPOINTS.CHARACTERS.BY_ID(id), null, { timeout: 10000 }),
  
  // 캐릭터 생성 (최적화됨)
  create: async (characterData) => {
    try {
      // 필수 필드 검증
      if (!characterData.name?.trim()) {
        throw new Error('캐릭터 이름은 필수입니다.');
      }
      if (!characterData.avatarUrl?.trim()) {
        throw new Error('프로필 이미지는 필수입니다.');
      }
      
      const response = await apiCall('post', API_ENDPOINTS.CHARACTERS.BASE, characterData, { 
        retries: 2,
        timeout: 20000 
      });
      
      safeLog('info', '✅ 캐릭터 생성 성공', { characterId: response.data.id, name: response.data.name });
      return response;
    } catch (error) {
      safeLog('error', '❌ 캐릭터 생성 실패', { error: error.message, characterData: { name: characterData.name } });
      throw error;
    }
  },
  
  // 캐릭터 수정 (최적화됨)
  update: async (id, characterData) => {
    try {
      const response = await apiCall('put', API_ENDPOINTS.CHARACTERS.BY_ID(id), characterData, { 
        retries: 2,
        timeout: 20000 
      });
      
      safeLog('info', '✅ 캐릭터 수정 성공', { characterId: id, name: response.data.name });
      return response;
    } catch (error) {
      safeLog('error', '❌ 캐릭터 수정 실패', { characterId: id, error: error.message });
      throw error;
    }
  },
  
  delete: (id) => apiCall('delete', API_ENDPOINTS.CHARACTERS.BY_ID(id), null, { timeout: 10000 }),
  getTypes: () => apiCall('get', API_ENDPOINTS.CHARACTERS.TYPES, null, { timeout: 5000 }),
  getHashtags: () => apiCall('get', API_ENDPOINTS.CHARACTERS.HASHTAGS, null, { timeout: 5000 })
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

// Hearts API (최적화됨)
export const heartsAPI = {
  // 하트 잔액 조회 (캐싱 포함)
  getBalance: async () => {
    try {
      const response = await apiCall('get', API_ENDPOINTS.HEARTS.BALANCE, null, { timeout: 10000 });
      
      // 로컬 캐시에 저장 (1분 유효)
      localStorage.setItem('heartBalance', JSON.stringify({
        hearts: response.data.hearts,
        timestamp: Date.now()
      }));
      
      return response;
    } catch (error) {
      // 캐시된 데이터 사용 시도
      try {
        const cached = JSON.parse(localStorage.getItem('heartBalance') || '{}');
        if (cached.hearts && Date.now() - cached.timestamp < 60000) {
          safeLog('warn', '🔄 하트 잔액 캐시 사용', { cachedHearts: cached.hearts });
          return { data: { hearts: cached.hearts } };
        }
      } catch (cacheError) {
        // 캐시 에러 무시
      }
      throw error;
    }
  },
  
  // 하트 충전
  charge: (amount) => apiCall('post', API_ENDPOINTS.HEARTS.CHARGE, { amount }, { 
    retries: 2,
    timeout: 20000 // 결제는 더 긴 타임아웃
  }),
  
  // 하트 구매
  purchase: (purchaseData) => apiCall('post', API_ENDPOINTS.HEARTS.PURCHASE, purchaseData, { 
    retries: 2,
    timeout: 30000 // 결제는 가장 긴 타임아웃
  }),
  
  // 하트 거래 내역
  getTransactions: () => apiCall('get', API_ENDPOINTS.HEARTS.TRANSACTIONS, null, { timeout: 10000 }),
  
  // 하트 소모 함수 (채팅 메시지 전송용) - 최적화됨
  spend: async (amount, description) => {
    try {
      const response = await apiCall('post', API_ENDPOINTS.HEARTS.SPEND, { amount, description }, { 
        retries: 2,
        timeout: 10000
      });
      
      // 성공 시 캐시 업데이트
      if (response.data.hearts !== undefined) {
        localStorage.setItem('heartBalance', JSON.stringify({
          hearts: response.data.hearts,
          timestamp: Date.now()
        }));
      }
      
      return response;
    } catch (error) {
      safeLog('error', '❌ 하트 소모 실패', { amount, description, error: error.message });
      throw error;
    }
  }
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
export { api as default, API_CONFIG, API_ENDPOINTS, apiCall }; 