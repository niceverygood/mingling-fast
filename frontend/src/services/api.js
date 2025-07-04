import axios from 'axios';

// 🚀 새로운 전략: 다중 엔드포인트 설정
const API_ENDPOINTS = {
  primary: 'https://api.minglingchat.com',
  direct: 'http://43.201.40.223:8001', // EC2 직접 IP
  fallback: 'https://api.minglingchat.com'
};

// 현재 사용할 엔드포인트 선택
let currentEndpoint = API_ENDPOINTS.primary;

// 디버깅용 로그
console.log('🔧 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  PRIMARY_URL: API_ENDPOINTS.primary,
  DIRECT_URL: API_ENDPOINTS.direct,
  CURRENT_URL: currentEndpoint,
  window_location: typeof window !== 'undefined' ? window.location.href : 'N/A'
});

// Axios 인스턴스 생성 (동적 baseURL)
const api = axios.create({
  timeout: 15000,
  // withCredentials 완전 제거 - 헤더 기반 인증만 사용
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// 동적 baseURL 설정
api.interceptors.request.use(
  (config) => {
    config.baseURL = currentEndpoint;
    
    // axios.defaults.headers.common에서 헤더 복사
    if (axios.defaults.headers.common['X-User-ID']) {
      config.headers['X-User-ID'] = axios.defaults.headers.common['X-User-ID'];
    }
    if (axios.defaults.headers.common['X-User-Email']) {
      config.headers['X-User-Email'] = axios.defaults.headers.common['X-User-Email'];
    }
    
    // 디버깅용 로그
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      headers: {
        'X-User-ID': config.headers['X-User-ID'],
        'X-User-Email': config.headers['X-User-Email'],
        'Content-Type': config.headers['Content-Type']
      }
    });
    
    return config;
  },
  (error) => {
    console.error('🚨 API Request Error:', error);
    return Promise.reject(error);
  }
);

// 🔄 자동 엔드포인트 전환 기능
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      url: response.config.url,
      baseURL: response.config.baseURL,
      data: response.data ? 'Data received' : 'No data'
    });
    return response;
  },
  async (error) => {
    console.error('🚨 API Response Error:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      message: error.message,
      data: error.response?.data
    });
    
    // CORS 에러 또는 네트워크 에러 시 직접 IP로 전환
    if (error.message?.includes('CORS') || 
        error.message?.includes('Network Error') ||
        error.code === 'ERR_NETWORK') {
      
      console.warn('🔄 CORS/Network Error detected - switching to direct IP');
      
      if (currentEndpoint === API_ENDPOINTS.primary) {
        currentEndpoint = API_ENDPOINTS.direct;
        console.log('🔄 Switched to direct IP:', currentEndpoint);
        
        // 요청 재시도
        const config = error.config;
        config.baseURL = currentEndpoint;
        return api.request(config);
      }
    }
    
    if (error.response?.status === 401) {
      console.warn('🔐 Authentication required - redirecting to login');
    }
    
    return Promise.reject(error);
  }
);

// 🛠️ 엔드포인트 수동 전환 함수
export const switchToDirectIP = () => {
  currentEndpoint = API_ENDPOINTS.direct;
  console.log('🔄 Manually switched to direct IP:', currentEndpoint);
};

export const switchToPrimary = () => {
  currentEndpoint = API_ENDPOINTS.primary;
  console.log('🔄 Manually switched to primary endpoint:', currentEndpoint);
};

// 🧪 연결 테스트 함수
export const testConnection = async () => {
  const results = {};
  
  for (const [name, url] of Object.entries(API_ENDPOINTS)) {
    try {
      const testApi = axios.create({
        baseURL: url,
        timeout: 5000,
        withCredentials: false
      });
      
      const response = await testApi.get('/api/health');
      results[name] = {
        status: 'success',
        url: url,
        responseTime: response.headers['x-response-time'] || 'N/A'
      };
    } catch (error) {
      results[name] = {
        status: 'failed',
        url: url,
        error: error.message
      };
    }
  }
  
  console.log('🧪 Connection Test Results:', results);
  return results;
};

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