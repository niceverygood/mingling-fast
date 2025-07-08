// 🌐 통합 API 설정 관리
// 모든 API URL 하드코딩 문제를 해결하는 중앙화된 설정

/**
 * 환경별 API 설정
 */
const API_ENVIRONMENTS = {
  development: {
    baseURL: 'http://localhost:8001',
    timeout: 10000,
    enableDebug: true
  },
  production: {
    baseURL: 'https://api.minglingchat.com',
    timeout: 15000,
    enableDebug: false
  },
  test: {
    baseURL: 'http://localhost:8001',
    timeout: 5000,
    enableDebug: true
  }
};

/**
 * 현재 환경 감지
 */
const getCurrentEnvironment = () => {
  // 환경 변수 우선 확인
  if (process.env.REACT_APP_ENV) {
    return process.env.REACT_APP_ENV;
  }
  
  // NODE_ENV 기반 환경 감지
  if (process.env.NODE_ENV === 'production') {
    return 'production';
  }
  
  if (process.env.NODE_ENV === 'test') {
    return 'test';
  }
  
  return 'development';
};

/**
 * API 설정 가져오기
 */
const getApiConfig = () => {
  const environment = getCurrentEnvironment();
  const envConfig = API_ENVIRONMENTS[environment] || API_ENVIRONMENTS.development;
  
  // 환경 변수로 개별 설정 오버라이드 가능
  const config = {
    baseURL: process.env.REACT_APP_API_URL || envConfig.baseURL,
    timeout: parseInt(process.env.REACT_APP_API_TIMEOUT) || envConfig.timeout,
    enableDebug: process.env.REACT_APP_API_DEBUG === 'true' || envConfig.enableDebug,
    environment
  };
  
  // API 경로 자동 추가 (baseURL에 /api가 없으면 추가)
  if (!config.baseURL.endsWith('/api') && !config.baseURL.includes('/api/')) {
    config.apiURL = config.baseURL + '/api';
  } else {
    config.apiURL = config.baseURL;
  }
  
  return config;
};

/**
 * 현재 API 설정
 */
const API_CONFIG = getApiConfig();

/**
 * API 헬스체크 함수
 */
export const checkApiHealth = async () => {
  try {
    const response = await fetch(`${API_CONFIG.baseURL}/api/health`, {
      method: 'GET',
      timeout: 5000
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        success: true,
        status: 'healthy',
        data,
        environment: API_CONFIG.environment,
        url: API_CONFIG.baseURL
      };
    } else {
      return {
        success: false,
        status: 'unhealthy',
        error: `HTTP ${response.status}`,
        environment: API_CONFIG.environment,
        url: API_CONFIG.baseURL
      };
    }
  } catch (error) {
    return {
      success: false,
      status: 'error',
      error: error.message,
      environment: API_CONFIG.environment,
      url: API_CONFIG.baseURL
    };
  }
};

/**
 * 배포 검증 함수
 */
export const validateDeployment = async () => {
  console.log('🔍 배포 환경 검증 시작...');
  
  const checks = {
    environment: API_CONFIG.environment,
    apiUrl: API_CONFIG.apiURL,
    healthCheck: null,
    timestamp: new Date().toISOString()
  };
  
  // Health Check
  try {
    checks.healthCheck = await checkApiHealth();
    console.log('✅ Health Check:', checks.healthCheck);
  } catch (error) {
    console.error('❌ Health Check 실패:', error);
    checks.healthCheck = { success: false, error: error.message };
  }
  
  // 환경별 검증
  if (API_CONFIG.environment === 'production') {
    console.log('🔍 프로덕션 환경 검증...');
    
    // HTTPS 확인
    if (!API_CONFIG.baseURL.startsWith('https://')) {
      console.warn('⚠️ 프로덕션 환경에서 HTTP 사용 중');
      checks.httpsWarning = true;
    }
    
    // Mixed Content 경고
    if (window.location.protocol === 'https:' && API_CONFIG.baseURL.startsWith('http://')) {
      console.error('❌ Mixed Content 에러 발생 가능: HTTPS → HTTP 요청');
      checks.mixedContentError = true;
    }
  }
  
  console.log('🔍 배포 검증 완료:', checks);
  return checks;
};

/**
 * 디버그 로깅
 */
if (API_CONFIG.enableDebug) {
  console.log('🔧 API Configuration:', {
    environment: API_CONFIG.environment,
    baseURL: API_CONFIG.baseURL,
    apiURL: API_CONFIG.apiURL,
    timeout: API_CONFIG.timeout,
    enableDebug: API_CONFIG.enableDebug,
    timestamp: new Date().toISOString()
  });
  
  // 자동 헬스체크 (개발 환경에서만)
  if (API_CONFIG.environment === 'development') {
    setTimeout(() => {
      checkApiHealth().then(result => {
        console.log('🏥 자동 헬스체크 결과:', result);
      });
    }, 2000);
  }
}

/**
 * API 엔드포인트 정의
 */
export const API_ENDPOINTS = {
  // Base URLs
  BASE: API_CONFIG.baseURL,
  API: API_CONFIG.apiURL,
  
  // Auth endpoints
  AUTH: {
    LOGIN: `${API_CONFIG.apiURL}/auth/login`,
    LOGOUT: `${API_CONFIG.apiURL}/auth/logout`,
    REFRESH: `${API_CONFIG.apiURL}/auth/refresh`
  },
  
  // User endpoints
  USERS: {
    BASE: `${API_CONFIG.apiURL}/users`,
    ME: `${API_CONFIG.apiURL}/users/profile`,
    UPDATE: `${API_CONFIG.apiURL}/users/update`
  },
  
  // Character endpoints
  CHARACTERS: {
    BASE: `${API_CONFIG.apiURL}/characters`,
    MY: `${API_CONFIG.apiURL}/characters/my`,
    RECOMMENDED: `${API_CONFIG.apiURL}/characters/recommended`,
    TYPES: `${API_CONFIG.apiURL}/characters/types`,
    HASHTAGS: `${API_CONFIG.apiURL}/characters/hashtags`,
    BY_ID: (id) => `${API_CONFIG.apiURL}/characters/${id}`
  },
  
  // Persona endpoints
  PERSONAS: {
    BASE: `${API_CONFIG.apiURL}/personas`,
    MY: `${API_CONFIG.apiURL}/personas/my`,
    BY_ID: (id) => `${API_CONFIG.apiURL}/personas/${id}`
  },
  
  // Chat endpoints
  CHATS: {
    BASE: `${API_CONFIG.apiURL}/chats`,
    BY_ID: (id) => `${API_CONFIG.apiURL}/chats/${id}`,
    MESSAGES: (chatId) => `${API_CONFIG.apiURL}/chats/${chatId}/messages`
  },
  
  // Conversation endpoints
  CONVERSATIONS: {
    BASE: `${API_CONFIG.apiURL}/conversations`,
    BY_ID: (id) => `${API_CONFIG.apiURL}/conversations/${id}`
  },
  
  // Relations/Favorability endpoints
  RELATIONS: {
    BASE: `${API_CONFIG.apiURL}/relations`,
    BY_CHARACTER: (characterId) => `${API_CONFIG.apiURL}/relations/${characterId}`,
    HISTORY: (characterId) => `${API_CONFIG.apiURL}/relations/${characterId}/history`,
    EVENT: (characterId) => `${API_CONFIG.apiURL}/relations/${characterId}/event`,
    ADJUST: (characterId) => `${API_CONFIG.apiURL}/relations/${characterId}/adjust`
  },
  
  // Payment endpoints (여러 경로 지원)
  PAYMENT: {
    CHARGE_HEARTS: [
      `${API_CONFIG.apiURL}/hearts/purchase`,
      `${API_CONFIG.apiURL}/payment/charge-hearts`,
      `${API_CONFIG.apiURL}/purchase/charge-hearts`,
      `${API_CONFIG.apiURL}/transaction/charge-hearts`,
      `${API_CONFIG.apiURL}/hearts/charge`
    ],
    VERIFY: `${API_CONFIG.apiURL}/payment/verify`,
    WEBHOOK: `${API_CONFIG.apiURL}/payment/webhook`
  },
  
  // Hearts endpoints
  HEARTS: {
    BASE: `${API_CONFIG.apiURL}/hearts`,
    BALANCE: `${API_CONFIG.apiURL}/hearts/balance`,
    PURCHASE: `${API_CONFIG.apiURL}/hearts/purchase`,
    CHARGE: `${API_CONFIG.apiURL}/hearts/charge`,
    TRANSACTIONS: `${API_CONFIG.apiURL}/hearts/transactions`
  },
  
  // Upload endpoints
  UPLOAD: {
    IMAGE: `${API_CONFIG.apiURL}/upload/image`,
    CHARACTER: `${API_CONFIG.apiURL}/upload/character-avatar`,
    PERSONA: `${API_CONFIG.apiURL}/upload/persona-avatar`,
    USER_PROFILE: `${API_CONFIG.apiURL}/upload/user-profile`
  },
  
  // Health/Debug endpoints
  HEALTH: `${API_CONFIG.apiURL}/health`,
  DEBUG: {
    STATS: `${API_CONFIG.apiURL}/debug/stats`
  }
};

/**
 * HTTP 헤더 설정
 */
export const getDefaultHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-User-ID': localStorage.getItem('userId') || '',
  'X-User-Email': localStorage.getItem('userEmail') || ''
});

/**
 * Axios 설정 객체
 */
export const getAxiosConfig = () => ({
  baseURL: API_CONFIG.apiURL,
  timeout: API_CONFIG.timeout,
  withCredentials: false,
  // 기본 헤더에서 Content-Type 제거 (인터셉터에서 동적으로 설정)
  headers: {
    'Accept': 'application/json',
    'X-User-ID': localStorage.getItem('userId') || '',
    'X-User-Email': localStorage.getItem('userEmail') || ''
  }
});

/**
 * API 환경 정보 내보내기
 */
export const API_INFO = {
  environment: getCurrentEnvironment(),
  config: API_CONFIG,
  endpoints: API_ENDPOINTS,
  validate: validateDeployment,
  healthCheck: checkApiHealth
};

// 개발 환경에서 전역 디버그 객체 생성
if (API_CONFIG.enableDebug && typeof window !== 'undefined') {
  window.apiDebugInfo = API_INFO;
  console.log('🔍 API Debug Info available at window.apiDebugInfo');
  console.log('🔍 배포 검증: window.apiDebugInfo.validate()');
  console.log('🔍 헬스체크: window.apiDebugInfo.healthCheck()');
}

export default API_CONFIG; 