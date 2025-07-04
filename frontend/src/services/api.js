import axios from 'axios';

// 🔍 디버깅 모드 설정 (프로덕션에서도 안전)
const DEBUG_MODE = process.env.NODE_ENV === 'development' || 
                   process.env.REACT_APP_DEBUG === 'true' ||
                   window.location.search.includes('debug=true');

// 🌐 환경별 API 베이스 URL 설정
const getApiBaseUrl = () => {
  // Vercel 환경 변수 우선 사용
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 환경별 기본값
  if (process.env.NODE_ENV === 'production') {
    return 'https://api.minglingchat.com';
  } else if (process.env.NODE_ENV === 'development') {
    return process.env.REACT_APP_API_URL || 'http://localhost:8001';
  }
  
  // 기본값
  return 'https://api.minglingchat.com';
};

const API_BASE_URL = getApiBaseUrl();

// 🔧 환경 정보 로깅
console.log('🔧 Environment Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  REACT_APP_API_URL: process.env.REACT_APP_API_URL,
  API_BASE_URL: API_BASE_URL,
  DEBUG_MODE: DEBUG_MODE,
  window_location: typeof window !== 'undefined' ? window.location.href : 'N/A',
  timestamp: new Date().toISOString()
});

// 📊 API 요청 통계
const apiStats = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  corsErrors: 0,
  networkErrors: 0,
  lastError: null,
  lastSuccess: null
};

// 🔍 안전한 로깅 함수
const safeLog = (level, message, data = {}) => {
  const logData = {
    timestamp: new Date().toISOString(),
    level: level,
    message: message,
    url: window.location.href,
    userAgent: navigator.userAgent.substring(0, 50) + '...',
    ...data
  };
  
  if (DEBUG_MODE) {
    console[level](`[API ${level.toUpperCase()}]`, message, data);
  }
  
  // 프로덕션에서는 에러만 로컬 스토리지에 저장 (최대 10개)
  if (level === 'error') {
    try {
      const logs = JSON.parse(localStorage.getItem('api_error_logs') || '[]');
      logs.unshift(logData);
      localStorage.setItem('api_error_logs', JSON.stringify(logs.slice(0, 10)));
    } catch (e) {
      // 로컬 스토리지 에러 무시
    }
  }
};

// 🌐 CORS 헤더 분석 함수
const analyzeCorsHeaders = (response) => {
  const corsHeaders = {
    'access-control-allow-origin': response.headers['access-control-allow-origin'],
    'access-control-allow-credentials': response.headers['access-control-allow-credentials'],
    'access-control-allow-methods': response.headers['access-control-allow-methods'],
    'access-control-allow-headers': response.headers['access-control-allow-headers'],
    'access-control-expose-headers': response.headers['access-control-expose-headers'],
    'vary': response.headers['vary']
  };
  
  safeLog('info', 'CORS Headers Analysis', {
    url: response.config?.url,
    corsHeaders: corsHeaders,
    hasWildcardOrigin: corsHeaders['access-control-allow-origin'] === '*',
    hasCredentials: corsHeaders['access-control-allow-credentials'] === 'true'
  });
  
  return corsHeaders;
};

// 🚨 에러 분류 함수
const classifyError = (error) => {
  if (error.message?.includes('CORS')) {
    apiStats.corsErrors++;
    return 'CORS_ERROR';
  } else if (error.message?.includes('Network Error') || error.code === 'ERR_NETWORK') {
    apiStats.networkErrors++;
    return 'NETWORK_ERROR';
  } else if (error.response?.status >= 400 && error.response?.status < 500) {
    return 'CLIENT_ERROR';
  } else if (error.response?.status >= 500) {
    return 'SERVER_ERROR';
  } else {
    return 'UNKNOWN_ERROR';
  }
};

// 📈 API 통계 리포트 생성
const generateApiReport = () => {
  const report = {
    ...apiStats,
    successRate: apiStats.totalRequests > 0 ? 
      (apiStats.successfulRequests / apiStats.totalRequests * 100).toFixed(2) + '%' : '0%',
    timestamp: new Date().toISOString()
  };
  
  safeLog('info', 'API Statistics Report', report);
  return report;
};

// 🔍 전역 API 디버깅 함수 (브라우저 콘솔에서 사용 가능)
window.apiDebug = {
  getStats: generateApiReport,
  getErrorLogs: () => JSON.parse(localStorage.getItem('api_error_logs') || '[]'),
  clearErrorLogs: () => localStorage.removeItem('api_error_logs'),
  enableDebug: () => { window.sessionStorage.setItem('debug_mode', 'true'); window.location.reload(); },
  disableDebug: () => { window.sessionStorage.removeItem('debug_mode'); window.location.reload(); }
};

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: false, // Cloudflare 환경에서는 false로 유지
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// 요청 인터셉터 - 고급 디버깅 및 모니터링
api.interceptors.request.use(
  (config) => {
    // 요청 통계 업데이트
    apiStats.totalRequests++;
    
    // 요청 시작 시간 기록
    config.metadata = { startTime: Date.now() };
    
    // axios.defaults.headers.common에서 헤더 복사
    if (axios.defaults.headers.common['X-User-ID']) {
      config.headers['X-User-ID'] = axios.defaults.headers.common['X-User-ID'];
    }
    if (axios.defaults.headers.common['X-User-Email']) {
      config.headers['X-User-Email'] = axios.defaults.headers.common['X-User-Email'];
    }
    
    // 요청 정보 로깅
    const requestInfo = {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: {
        'X-User-ID': config.headers['X-User-ID'],
        'X-User-Email': config.headers['X-User-Email'],
        'Content-Type': config.headers['Content-Type'],
        'Origin': window.location.origin
      },
      withCredentials: config.withCredentials,
      timeout: config.timeout
    };
    
    safeLog('info', '🚀 API Request Started', requestInfo);
    
    return config;
  },
  (error) => {
    apiStats.failedRequests++;
    const errorType = classifyError(error);
    
    safeLog('error', '🚨 API Request Setup Error', {
      errorType: errorType,
      message: error.message,
      stack: DEBUG_MODE ? error.stack : undefined
    });
    
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 고급 에러 처리 및 분석
api.interceptors.response.use(
  (response) => {
    // 응답 시간 계산
    const responseTime = response.config.metadata ? 
      Date.now() - response.config.metadata.startTime : 0;
    
    // 성공 통계 업데이트
    apiStats.successfulRequests++;
    apiStats.lastSuccess = {
      url: response.config.url,
      status: response.status,
      timestamp: new Date().toISOString(),
      responseTime: responseTime
    };
    
    // CORS 헤더 분석
    const corsHeaders = analyzeCorsHeaders(response);
    
    // 응답 정보 로깅
    const responseInfo = {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      baseURL: response.config.baseURL,
      responseTime: `${responseTime}ms`,
      dataSize: response.data ? JSON.stringify(response.data).length : 0,
      corsOrigin: corsHeaders['access-control-allow-origin'],
      hasData: !!response.data
    };
    
    safeLog('info', '✅ API Response Success', responseInfo);
    
    return response;
  },
  (error) => {
    // 응답 시간 계산
    const responseTime = error.config?.metadata ? 
      Date.now() - error.config.metadata.startTime : 0;
    
    // 실패 통계 업데이트
    apiStats.failedRequests++;
    const errorType = classifyError(error);
    
    // 상세한 에러 정보 수집
    const errorInfo = {
      errorType: errorType,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      method: error.config?.method?.toUpperCase(),
      responseTime: `${responseTime}ms`,
      message: error.message,
      code: error.code,
      corsHeaders: error.response ? {
        'access-control-allow-origin': error.response.headers?.['access-control-allow-origin'],
        'access-control-allow-credentials': error.response.headers?.['access-control-allow-credentials']
      } : null,
      requestHeaders: DEBUG_MODE ? {
        'Origin': window.location.origin,
        'User-Agent': navigator.userAgent.substring(0, 50) + '...'
      } : undefined,
      responseData: error.response?.data,
      stack: DEBUG_MODE ? error.stack : undefined
    };
    
    // 마지막 에러 정보 저장
    apiStats.lastError = {
      ...errorInfo,
      timestamp: new Date().toISOString()
    };
    
    safeLog('error', '🚨 API Response Error', errorInfo);
    
    // CORS 에러 특별 처리
    if (errorType === 'CORS_ERROR') {
      safeLog('warn', '🔒 CORS Error Detected', {
        suggestion: 'Check if the API server is running and CORS is properly configured',
        currentOrigin: window.location.origin,
        targetURL: error.config?.url
      });
    }
    
    // 네트워크 에러 특별 처리
    if (errorType === 'NETWORK_ERROR') {
      safeLog('warn', '🌐 Network Error Detected', {
        suggestion: 'Check internet connection and API server availability',
        targetURL: error.config?.url
      });
    }
    
    return Promise.reject(error);
  }
);

// Characters API
export const charactersAPI = {
  // 모든 공개 캐릭터 목록 조회
  getAll: () => api.get('/api/characters'),
  
  // 내가 만든 캐릭터 목록 조회
  getMy: () => api.get('/api/characters/my'),
  
  // 추천 캐릭터 목록 조회
  getRecommended: () => api.get('/api/characters/recommended'),
  
  // 특정 캐릭터 상세 조회
  getById: (id) => api.get(`/api/characters/${id}`),
  
  // 새 캐릭터 생성
  create: (characterData) => api.post('/api/characters', characterData),
  
  // 캐릭터 수정
  update: (id, characterData) => api.put(`/api/characters/${id}`, characterData),
  
  // 캐릭터 유형 목록 조회
  getTypes: () => api.get('/api/characters/types'),
  
  // 해시태그 카테고리 목록 조회
  getHashtags: () => api.get('/api/characters/hashtags'),
};

// Personas API
export const personasAPI = {
  // 모든 페르소나 목록 조회
  getAll: () => api.get('/api/personas'),
  
  // 내가 만든 페르소나 목록 조회
  getMy: () => api.get('/api/personas/my'),
  
  // 특정 페르소나 상세 조회
  getById: (id) => api.get(`/api/personas/${id}`),
  
  // 새 페르소나 생성
  create: (personaData) => api.post('/api/personas', personaData),
  
  // 페르소나 수정
  update: (id, personaData) => api.put(`/api/personas/${id}`, personaData),
  
  // 페르소나 삭제
  delete: (id) => api.delete(`/api/personas/${id}`),
};

// Conversations API (새로 추가됨)
export const conversationsAPI = {
  // 대화 목록 조회 (필터링 옵션)
  getAll: (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.characterId) params.append('characterId', filters.characterId);
    if (filters.personaId) params.append('personaId', filters.personaId);
    
    return api.get(`/api/conversations?${params.toString()}`);
  },
  
  // 특정 캐릭터와의 대화 목록
  getByCharacter: (characterId) => 
    api.get(`/api/conversations?characterId=${characterId}`),
  
  // 특정 페르소나의 대화 목록
  getByPersona: (personaId) => 
    api.get(`/api/conversations?personaId=${personaId}`),
  
  // 새 대화 시작
  create: (conversationData) => api.post('/api/conversations', conversationData),
  
  // 특정 대화의 메시지들 조회
  getMessages: (conversationId) => 
    api.get(`/api/conversations/${conversationId}/messages`),
};

// Chats API (기존)
export const chatsAPI = {
  // 채팅 목록 조회
  getAll: () => api.get('/api/chats'),
  
  // 특정 채팅의 메시지들 조회
  getMessages: (chatId) => api.get(`/api/chats/${chatId}/messages`),
  
  // 새 메시지 전송
  sendMessage: (chatId, messageData) => 
    api.post(`/api/chats/${chatId}/messages`, messageData),
  
  // 새 채팅 시작
  create: (chatData) => api.post('/api/chats', chatData),
};

// Users API
export const usersAPI = {
  // 사용자 프로필 조회
  getProfile: () => api.get('/api/users/profile'),
  
  // 사용자 프로필 수정
  updateProfile: (profileData) => api.put('/api/users/profile', profileData),
};

// Hearts API
export const heartsAPI = {
  // 하트 잔액 조회
  getBalance: () => api.get('/api/hearts/balance'),
  
  // 하트 충전
  charge: (amount) => api.post('/api/hearts/charge', { amount }),
  
  // 하트 사용
  spend: (amount, description = '') => 
    api.post('/api/hearts/spend', { amount, description }),
  
  // 하트 거래 내역 조회
  getTransactions: () => api.get('/api/hearts/transactions'),
};

// Auth API
export const authAPI = {
  // 로그아웃
  logout: () => api.post('/api/auth/logout'),
  
  // 회원탈퇴
  withdraw: () => api.delete('/api/auth/withdraw'),
};

export default api; 