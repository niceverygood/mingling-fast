const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://minglingchat.com/api' 
  : 'http://localhost:8001/api';

// 호감도 정보 조회
export const getRelationInfo = async (characterId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/relations/${characterId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': localStorage.getItem('firebaseUserId') || 'test-user-123',
        'X-User-Email': localStorage.getItem('userEmail') || 'test@example.com'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching relation info:', error);
    throw error;
  }
};

// 특별 이벤트 처리
export const processSpecialEvent = async (characterId, eventType, deltaScore, description) => {
  try {
    const response = await fetch(`${API_BASE_URL}/relations/${characterId}/event`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': localStorage.getItem('firebaseUserId') || 'test-user-123',
        'X-User-Email': localStorage.getItem('userEmail') || 'test@example.com'
      },
      body: JSON.stringify({
        eventType,
        deltaScore,
        description
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error processing special event:', error);
    throw error;
  }
};

// 호감도 히스토리 조회
export const getRelationHistory = async (characterId, limit = 20, offset = 0) => {
  try {
    const response = await fetch(`${API_BASE_URL}/relations/${characterId}/history?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': localStorage.getItem('firebaseUserId') || 'test-user-123',
        'X-User-Email': localStorage.getItem('userEmail') || 'test@example.com'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching relation history:', error);
    throw error;
  }
};

// 모든 관계 조회
export const getAllRelations = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/relations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': localStorage.getItem('firebaseUserId') || 'test-user-123',
        'X-User-Email': localStorage.getItem('userEmail') || 'test@example.com'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching all relations:', error);
    throw error;
  }
};

// 수동 점수 조정 (테스트용)
export const adjustScore = async (characterId, deltaScore, reason) => {
  try {
    const response = await fetch(`${API_BASE_URL}/relations/${characterId}/adjust`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': localStorage.getItem('firebaseUserId') || 'test-user-123',
        'X-User-Email': localStorage.getItem('userEmail') || 'test@example.com'
      },
      body: JSON.stringify({
        deltaScore,
        reason
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error adjusting score:', error);
    throw error;
  }
};

// 특별 이벤트 타입 정의
export const SPECIAL_EVENTS = {
  GIFT_FLOWER: { type: 'gift', deltaScore: 25, description: '꽃 선물' },
  GIFT_CHOCOLATE: { type: 'gift', deltaScore: 20, description: '초콜릿 선물' },
  GIFT_JEWELRY: { type: 'gift', deltaScore: 40, description: '액세서리 선물' },
  DATE_CAFE: { type: 'date', deltaScore: 30, description: '카페 데이트' },
  DATE_MOVIE: { type: 'date', deltaScore: 35, description: '영화 데이트' },
  DATE_DINNER: { type: 'date', deltaScore: 45, description: '저녁 식사 데이트' },
  CONFESSION: { type: 'confession', deltaScore: 60, description: '고백' },
  PROPOSAL: { type: 'proposal', deltaScore: 100, description: '프로포즈' },
  ANNIVERSARY: { type: 'anniversary', deltaScore: 50, description: '기념일 축하' },
  CONFLICT_MINOR: { type: 'conflict', deltaScore: -15, description: '작은 갈등' },
  CONFLICT_MAJOR: { type: 'conflict', deltaScore: -40, description: '큰 갈등' },
  BETRAYAL: { type: 'betrayal', deltaScore: -80, description: '배신' }
}; 