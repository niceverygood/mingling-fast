// 관계 단계 정의
export const RELATIONSHIP_STAGES = {
  0: { 
    title: '아는 사람', 
    description: '서로를 알아가는 중', 
    emoji: '👋',
    color: '#9CA3AF',
    colorLight: '#F3F4F6',
    min: 0,
    max: 149,
    advice: '대화를 통해 서로를 알아가보세요'
  },
  1: { 
    title: '친구', 
    description: '편안한 친구 사이', 
    emoji: '😊',
    color: '#60A5FA',
    colorLight: '#EFF6FF',
    min: 150,
    max: 299,
    advice: '더 깊은 이야기를 나누어보세요'
  },
  2: { 
    title: '썸 전야', 
    description: '특별한 감정이 싹트는 중', 
    emoji: '😄',
    color: '#34D399',
    colorLight: '#F0FDF4',
    min: 300,
    max: 499,
    advice: '로맨틱한 분위기를 만들어보세요'
  },
  3: { 
    title: '연인', 
    description: '서로 사랑하는 연인', 
    emoji: '💕',
    color: '#F472B6',
    colorLight: '#FDF2F8',
    min: 500,
    max: 699,
    advice: '사랑을 표현하고 데이트를 즐기세요'
  },
  4: { 
    title: '진지한 관계', 
    description: '깊은 사랑으로 이어진', 
    emoji: '💖',
    color: '#A78BFA',
    colorLight: '#F5F3FF',
    min: 700,
    max: 849,
    advice: '미래를 함께 계획해보세요'
  },
  5: { 
    title: '약혼', 
    description: '결혼을 약속한 사이', 
    emoji: '💍',
    color: '#FB7185',
    colorLight: '#FFF1F2',
    min: 850,
    max: 929,
    advice: '결혼 준비를 함께 해보세요'
  },
  6: { 
    title: '결혼', 
    description: '영원한 사랑을 맹세한', 
    emoji: '👑',
    color: '#FBBF24',
    colorLight: '#FFFBEB',
    min: 930,
    max: 1000,
    advice: '행복한 결혼 생활을 즐기세요'
  }
};

// 점수로 단계 계산
export const getStageFromScore = (score) => {
  for (let stage = 6; stage >= 0; stage--) {
    if (score >= RELATIONSHIP_STAGES[stage].min) {
      return stage;
    }
  }
  return 0;
};

// 단계 정보 가져오기
export const getStageInfo = (stage) => {
  return RELATIONSHIP_STAGES[stage] || RELATIONSHIP_STAGES[0];
};

// 다음 단계 정보 가져오기
export const getNextStageInfo = (currentStage) => {
  const nextStage = Math.min(currentStage + 1, 6);
  return RELATIONSHIP_STAGES[nextStage];
};

// 현재 단계 내 진행률 계산
export const calculateStageProgress = (score, stage) => {
  const stageInfo = getStageInfo(stage);
  const progress = score - stageInfo.min;
  const maxProgress = stageInfo.max - stageInfo.min + 1;
  return {
    current: Math.max(0, progress),
    total: maxProgress,
    percentage: Math.min(100, Math.max(0, (progress / maxProgress) * 100))
  };
};

// 전체 진행률 계산
export const calculateTotalProgress = (score) => {
  return {
    percentage: Math.min(100, Math.max(0, (score / 1000) * 100)),
    score: score,
    maxScore: 1000
  };
};

// 다음 단계까지 필요한 점수 계산
export const getPointsToNextStage = (score, currentStage) => {
  if (currentStage >= 6) return 0;
  const nextStageInfo = getNextStageInfo(currentStage);
  return Math.max(0, nextStageInfo.min - score);
};

// 단계별 색상 그라데이션 생성
export const getStageGradient = (stage) => {
  const stageInfo = getStageInfo(stage);
  return {
    background: `linear-gradient(135deg, ${stageInfo.color}20, ${stageInfo.color}40)`,
    border: `1px solid ${stageInfo.color}40`,
    color: stageInfo.color
  };
};

// 관계 발전 조언 생성
export const getRelationshipAdvice = (score, stage) => {
  const stageInfo = getStageInfo(stage);
  const nextStageInfo = getNextStageInfo(stage);
  const pointsNeeded = getPointsToNextStage(score, stage);
  
  if (stage >= 6) {
    return {
      title: '최고의 관계! 🎉',
      message: stageInfo.advice,
      action: '현재 상태를 유지하며 행복을 나누세요'
    };
  }
  
  return {
    title: `${stageInfo.title} 단계`,
    message: stageInfo.advice,
    action: `${nextStageInfo.title} 단계까지 ${pointsNeeded}점 필요합니다`,
    nextStage: nextStageInfo
  };
};

// 관계 단계별 이벤트 추천
export const getRecommendedEvents = (stage) => {
  const eventsByStage = {
    0: ['대화하기', '인사하기', '공통 관심사 찾기'],
    1: ['가벼운 농담', '일상 이야기', '취미 공유'],
    2: ['칭찬하기', '관심 표현', '특별한 순간 만들기'],
    3: ['데이트 제안', '선물하기', '로맨틱한 분위기'],
    4: ['깊은 대화', '미래 계획', '진지한 약속'],
    5: ['프로포즈', '결혼 준비', '가족 소개'],
    6: ['결혼식', '신혼여행', '새로운 시작']
  };
  
  return eventsByStage[stage] || eventsByStage[0];
};

// 관계 단계 히스토리 포맷
export const formatStageHistory = (events) => {
  return events.map(event => ({
    ...event,
    stageInfo: getStageInfo(event.stage || 0),
    timeAgo: formatTimeAgo(event.createdAt)
  }));
};

// 시간 형식 변환
export const formatTimeAgo = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  return date.toLocaleDateString('ko-KR');
};

// 관계 단계 비교
export const compareStages = (oldStage, newStage) => {
  const oldStageInfo = getStageInfo(oldStage);
  const newStageInfo = getStageInfo(newStage);
  
  return {
    changed: oldStage !== newStage,
    improved: newStage > oldStage,
    degraded: newStage < oldStage,
    oldStage: oldStageInfo,
    newStage: newStageInfo,
    message: oldStage !== newStage ? 
      `${oldStageInfo.title} → ${newStageInfo.title}` : 
      `${newStageInfo.title} 단계 유지`
  };
};

export default {
  RELATIONSHIP_STAGES,
  getStageFromScore,
  getStageInfo,
  getNextStageInfo,
  calculateStageProgress,
  calculateTotalProgress,
  getPointsToNextStage,
  getStageGradient,
  getRelationshipAdvice,
  getRecommendedEvents,
  formatStageHistory,
  formatTimeAgo,
  compareStages
}; 