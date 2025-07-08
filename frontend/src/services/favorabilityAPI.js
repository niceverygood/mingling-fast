import { API_ENDPOINTS, getDefaultHeaders } from '../config/api';

// 호감도 정보 조회
export const getRelationInfo = async (characterId) => {
  try {
    const response = await fetch(API_ENDPOINTS.RELATIONS.BY_CHARACTER(characterId), {
      method: 'GET',
      headers: getDefaultHeaders()
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
    const response = await fetch(API_ENDPOINTS.RELATIONS.EVENT(characterId), {
      method: 'POST',
      headers: getDefaultHeaders(),
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
    const response = await fetch(`${API_ENDPOINTS.RELATIONS.HISTORY(characterId)}?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: getDefaultHeaders()
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
    const response = await fetch(API_ENDPOINTS.RELATIONS.BASE, {
      method: 'GET',
      headers: getDefaultHeaders()
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
    const response = await fetch(API_ENDPOINTS.RELATIONS.ADJUST(characterId), {
      method: 'POST',
      headers: getDefaultHeaders(),
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