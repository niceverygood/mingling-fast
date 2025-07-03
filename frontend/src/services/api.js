import axios from 'axios';

// API 베이스 URL 설정 - 강제로 HTTPS API 사용
const API_BASE_URL = 'https://api.minglingchat.com';

// 디버깅용 로그
console.log('🔧 API Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  API_BASE_URL: API_BASE_URL,
  window_location: typeof window !== 'undefined' ? window.location.href : 'N/A'
});

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// 요청 인터셉터 - User ID 헤더 자동 추가
api.interceptors.request.use(
  (config) => {
    // axios.defaults.headers.common에서 헤더 복사
    if (axios.defaults.headers.common['X-User-ID']) {
      config.headers['X-User-ID'] = axios.defaults.headers.common['X-User-ID'];
    }
    if (axios.defaults.headers.common['X-User-Email']) {
      config.headers['X-User-Email'] = axios.defaults.headers.common['X-User-Email'];
    }
    return config;
  },
  (error) => {
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

// 에러 처리를 위한 인터셉터
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // 인증 오류 시 로그인 페이지로 리다이렉트
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api; 