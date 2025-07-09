/**
 * 관계 관리 API 서비스
 * 감정 상태, 추억, 성취 시스템을 포함한 포괄적인 관계 관리
 */

import { apiCall } from './api';
import { API_ENDPOINTS } from '../config/api';

// 모든 관계 조회
export const getAllRelations = async () => {
  try {
    const response = await apiCall('get', API_ENDPOINTS.RELATIONS.BASE);
    return response.data;
  } catch (error) {
    console.error('Error fetching all relations:', error);
    throw error;
  }
};

// 특정 캐릭터와의 관계 조회 (상세 정보)
export const getRelationInfo = async (characterId) => {
  try {
    const response = await apiCall('get', API_ENDPOINTS.RELATIONS.BY_CHARACTER(characterId));
    return response.data;
  } catch (error) {
    console.error('Error fetching relation info:', error);
    throw error;
  }
};

// 관계 통계 조회
export const getRelationStats = async (characterId) => {
  try {
    const response = await apiCall('get', `${API_ENDPOINTS.RELATIONS.BY_CHARACTER(characterId)}/stats`);
    return response.data;
  } catch (error) {
    console.error('Error fetching relation stats:', error);
    throw error;
  }
};

// 특별 이벤트 처리
export const processSpecialEvent = async (characterId, eventType, description, metadata = {}) => {
  try {
    const response = await apiCall('post', API_ENDPOINTS.RELATIONS.EVENT(characterId), {
      eventType,
      description,
      metadata
    });
    return response.data;
  } catch (error) {
    console.error('Error processing special event:', error);
    throw error;
  }
};

// 추억 조회
export const getMemories = async (characterId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.highlight) params.append('highlight', filters.highlight.toString());
    
    const url = `${API_ENDPOINTS.RELATIONS.BY_CHARACTER(characterId)}/memories${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await apiCall('get', url);
    return response.data;
  } catch (error) {
    console.error('Error fetching memories:', error);
    throw error;
  }
};

// 성취 조회
export const getAchievements = async (characterId) => {
  try {
    const response = await apiCall('get', `${API_ENDPOINTS.RELATIONS.BY_CHARACTER(characterId)}/achievements`);
    return response.data;
  } catch (error) {
    console.error('Error fetching achievements:', error);
    throw error;
  }
};

// 감정 상태 업데이트
export const updateMood = async (characterId, mood, reason = null) => {
  try {
    const response = await apiCall('post', `${API_ENDPOINTS.RELATIONS.BY_CHARACTER(characterId)}/mood`, {
      mood,
      reason
    });
    return response.data;
  } catch (error) {
    console.error('Error updating mood:', error);
    throw error;
  }
};

// 추억 생성
export const createMemory = async (characterId, memoryData) => {
  try {
    const response = await apiCall('post', `${API_ENDPOINTS.RELATIONS.BY_CHARACTER(characterId)}/memory`, memoryData);
    return response.data;
  } catch (error) {
    console.error('Error creating memory:', error);
    throw error;
  }
};

// 관계 이벤트 히스토리 조회
export const getEventHistory = async (characterId, limit = 20, offset = 0) => {
  try {
    const response = await apiCall('get', `${API_ENDPOINTS.RELATIONS.HISTORY(characterId)}?limit=${limit}&offset=${offset}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching event history:', error);
    throw error;
  }
};

// 특별 이벤트 타입 정의
export const SPECIAL_EVENTS = {
  // 선물 이벤트
  FLOWER: { 
    id: 'flower', 
    title: '꽃 선물', 
    emoji: '🌹', 
    cost: 25, 
    description: '아름다운 꽃을 선물해요',
    category: 'gift'
  },
  CHOCOLATE: { 
    id: 'chocolate', 
    title: '초콜릿', 
    emoji: '🍫', 
    cost: 20, 
    description: '달콤한 초콜릿을 선물해요',
    category: 'gift'
  },
  JEWELRY: { 
    id: 'jewelry', 
    title: '악세서리', 
    emoji: '💎', 
    cost: 50, 
    description: '예쁜 악세서리를 선물해요',
    category: 'gift'
  },
  
  // 데이트 이벤트
  DATE_CAFE: { 
    id: 'date_cafe', 
    title: '카페 데이트', 
    emoji: '☕', 
    cost: 30, 
    description: '카페에서 데이트해요',
    category: 'date'
  },
  DATE_MOVIE: { 
    id: 'date_movie', 
    title: '영화 데이트', 
    emoji: '🎬', 
    cost: 35, 
    description: '영화를 함께 봐요',
    category: 'date'
  },
  DATE_DINNER: { 
    id: 'date_dinner', 
    title: '저녁 식사', 
    emoji: '🍽️', 
    cost: 45, 
    description: '로맨틱한 저녁을 함께해요',
    category: 'date'
  },
  
  // 특별 이벤트
  SURPRISE: { 
    id: 'surprise', 
    title: '깜짝 선물', 
    emoji: '🎁', 
    cost: 60, 
    description: '특별한 깜짝 선물을 준비해요',
    category: 'special'
  },
  CONFESSION: { 
    id: 'confession', 
    title: '고백', 
    emoji: '💝', 
    cost: 80, 
    description: '진심을 담아 고백해요',
    category: 'special'
  },
  PROPOSAL: { 
    id: 'proposal', 
    title: '프로포즈', 
    emoji: '💍', 
    cost: 100, 
    description: '영원한 사랑을 약속해요',
    category: 'special'
  }
};

// 감정 상태 정의
export const MOODS = {
  neutral: { label: '평온함', description: '평온한 상태예요', emoji: '😐' },
  friendly: { label: '친근함', description: '친근한 분위기예요', emoji: '😊' },
  happy: { label: '기쁨', description: '기분이 좋아 보여요!', emoji: '😄' },
  excited: { label: '설렘', description: '설레고 있는 것 같아요!', emoji: '🤗' },
  loving: { label: '사랑', description: '사랑이 넘쳐 보여요!', emoji: '😍' },
  devoted: { label: '헌신', description: '깊은 애정을 느끼고 있어요', emoji: '🥰' },
  blissful: { label: '행복', description: '행복에 가득 차 있어요', emoji: '😇' },
  sad: { label: '슬픔', description: '조금 슬퍼 보여요', emoji: '😢' },
  disappointed: { label: '실망', description: '실망한 것 같아요', emoji: '😔' },
  angry: { label: '화남', description: '화가 난 것 같아요', emoji: '😠' }
};

// 관계 단계 정의
export const RELATIONSHIP_STAGES = {
  0: { 
    title: '아는 사람', 
    description: '서로를 알아가는 중이에요',
    color: 'text-gray-500', 
    bgColor: 'bg-gray-100',
    min: 0,
    max: 149
  },
  1: { 
    title: '친구', 
    description: '편안한 친구 사이에요',
    color: 'text-blue-500', 
    bgColor: 'bg-blue-100',
    min: 150,
    max: 299
  },
  2: { 
    title: '가까운 친구', 
    description: '특별한 감정이 싹트고 있어요',
    color: 'text-green-500', 
    bgColor: 'bg-green-100',
    min: 300,
    max: 499
  },
  3: { 
    title: '연인', 
    description: '서로 사랑하는 연인 사이에요',
    color: 'text-pink-500', 
    bgColor: 'bg-pink-100',
    min: 500,
    max: 699
  },
  4: { 
    title: '진지한 관계', 
    description: '깊은 사랑으로 이어져 있어요',
    color: 'text-purple-500', 
    bgColor: 'bg-purple-100',
    min: 700,
    max: 849
  },
  5: { 
    title: '약혼', 
    description: '결혼을 약속한 사이에요',
    color: 'text-red-500', 
    bgColor: 'bg-red-100',
    min: 850,
    max: 929
  },
  6: { 
    title: '결혼', 
    description: '영원한 사랑을 맹세한 사이에요',
    color: 'text-yellow-500', 
    bgColor: 'bg-yellow-100',
    min: 930,
    max: 1000
  }
};

// 유틸리티 함수들
export const getStageInfo = (stage) => {
  return RELATIONSHIP_STAGES[stage] || RELATIONSHIP_STAGES[0];
};

export const getMoodInfo = (mood) => {
  return MOODS[mood] || MOODS.neutral;
};

export const getEventsByCategory = (category) => {
  return Object.values(SPECIAL_EVENTS).filter(event => event.category === category);
};

export const calculateProgress = (score, stage) => {
  const stageInfo = getStageInfo(stage);
  const progress = score - stageInfo.min;
  const maxProgress = stageInfo.max - stageInfo.min + 1;
  return {
    current: Math.max(0, progress),
    total: maxProgress,
    percentage: Math.min(100, Math.max(0, (progress / maxProgress) * 100))
  };
}; 