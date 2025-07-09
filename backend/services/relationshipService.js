/**
 * 관계 관리 서비스
 * 감정 상태, 추억, 성취 시스템을 포함한 포괄적인 관계 관리
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 감정 상태 정의
const MOODS = {
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

// 관계 단계별 기본 감정 상태
const STAGE_MOODS = {
  0: 'neutral',
  1: 'friendly',
  2: 'happy',
  3: 'excited',
  4: 'loving',
  5: 'devoted',
  6: 'blissful'
};

// 성취 정의
const ACHIEVEMENTS = {
  first_meet: {
    id: 'first_meet',
    title: '첫 만남',
    description: '처음 대화를 나눴어요',
    icon: '👋',
    category: 'milestone',
    unlockCondition: { stage: 0, messages: 1 }
  },
  friend_level: {
    id: 'friend_level',
    title: '친구 되기',
    description: '친구 단계에 도달했어요',
    icon: '😊',
    category: 'milestone',
    unlockCondition: { stage: 1 }
  },
  close_friend: {
    id: 'close_friend',
    title: '마음 열기',
    description: '가까운 친구가 되었어요',
    icon: '💕',
    category: 'milestone',
    unlockCondition: { stage: 2 }
  },
  lover_level: {
    id: 'lover_level',
    title: '연인 되기',
    description: '연인 관계가 되었어요',
    icon: '💖',
    category: 'milestone',
    unlockCondition: { stage: 3 }
  },
  deep_love: {
    id: 'deep_love',
    title: '깊은 사랑',
    description: '진지한 관계로 발전했어요',
    icon: '💝',
    category: 'milestone',
    unlockCondition: { stage: 4 }
  },
  engagement: {
    id: 'engagement',
    title: '약혼',
    description: '약혼했어요',
    icon: '💍',
    category: 'milestone',
    unlockCondition: { stage: 5 }
  },
  marriage: {
    id: 'marriage',
    title: '결혼',
    description: '결혼했어요',
    icon: '👑',
    category: 'milestone',
    unlockCondition: { stage: 6 }
  },
  chatty: {
    id: 'chatty',
    title: '수다쟁이',
    description: '100회 이상 대화했어요',
    icon: '💬',
    category: 'activity',
    unlockCondition: { messages: 100 }
  },
  generous: {
    id: 'generous',
    title: '선물왕',
    description: '10번 이상 선물했어요',
    icon: '🎁',
    category: 'activity',
    unlockCondition: { gifts: 10 }
  },
  romantic: {
    id: 'romantic',
    title: '로맨티스트',
    description: '5번 이상 데이트했어요',
    icon: '💕',
    category: 'activity',
    unlockCondition: { dates: 5 }
  }
};

/**
 * 관계 감정 상태 업데이트
 */
const updateMood = async (relationId, newMood, reason = null) => {
  try {
    const relation = await prisma.relation.update({
      where: { id: relationId },
      data: { 
        mood: newMood,
        lastEventAt: new Date()
      }
    });

    // 감정 변화 로그 기록
    if (reason) {
      await prisma.relationEventLog.create({
        data: {
          relationId,
          eventType: 'mood_change',
          deltaScore: 0,
          description: `Mood changed to ${newMood}: ${reason}`,
          metadata: JSON.stringify({ oldMood: relation.mood, newMood, reason })
        }
      });
    }

    return relation;
  } catch (error) {
    console.error('❌ Error updating mood:', error);
    throw error;
  }
};

/**
 * 관계 단계에 따른 감정 상태 결정
 */
const determineMoodByStage = (stage, recentEvents = []) => {
  let baseMood = STAGE_MOODS[stage] || 'neutral';
  
  // 최근 이벤트에 따른 감정 조절
  const recentPositive = recentEvents.filter(e => e.deltaScore > 0).length;
  const recentNegative = recentEvents.filter(e => e.deltaScore < 0).length;
  
  if (recentNegative > recentPositive) {
    // 부정적 이벤트가 더 많으면 감정 하락
    if (stage >= 3) return 'disappointed';
    if (stage >= 1) return 'sad';
    return 'neutral';
  } else if (recentPositive > recentNegative + 1) {
    // 긍정적 이벤트가 많으면 감정 상승
    if (stage >= 5) return 'blissful';
    if (stage >= 3) return 'loving';
    if (stage >= 1) return 'excited';
    return 'happy';
  }
  
  return baseMood;
};

/**
 * 추억 생성
 */
const createMemory = async (relationId, memoryData) => {
  try {
    const memory = await prisma.relationMemory.create({
      data: {
        relationId,
        title: memoryData.title,
        description: memoryData.description,
        memoryType: memoryData.type || 'general',
        importance: memoryData.importance || 1,
        isHighlight: memoryData.isHighlight || false,
        messageId: memoryData.messageId || null,
        metadata: memoryData.metadata ? JSON.stringify(memoryData.metadata) : null
      }
    });

    console.log(`📸 Memory created: ${memory.title}`);
    return memory;
  } catch (error) {
    console.error('❌ Error creating memory:', error);
    throw error;
  }
};

/**
 * 자동 추억 생성 (특별한 순간 감지)
 */
const autoCreateMemory = async (relationId, eventType, context = {}) => {
  const memoryTemplates = {
    first_meet: {
      title: '첫 만남',
      description: '처음 인사했던 특별한 순간',
      type: 'first_meet',
      importance: 5,
      isHighlight: true
    },
    stage_up: {
      title: '관계 발전',
      description: `${context.fromStage}에서 ${context.toStage}로 발전한 의미있는 순간`,
      type: 'milestone',
      importance: 4,
      isHighlight: true
    },
    confession: {
      title: '고백',
      description: '서로의 마음을 확인했던 특별한 순간',
      type: 'confession',
      importance: 5,
      isHighlight: true
    },
    special_gift: {
      title: '특별한 선물',
      description: `${context.giftType}을 선물했던 따뜻한 순간`,
      type: 'gift',
      importance: 3,
      isHighlight: false
    },
    romantic_date: {
      title: '로맨틱 데이트',
      description: `${context.dateType}에서 함께한 달콤한 시간`,
      type: 'date',
      importance: 3,
      isHighlight: false
    }
  };

  const template = memoryTemplates[eventType];
  if (!template) return null;

  try {
    return await createMemory(relationId, {
      ...template,
      metadata: context
    });
  } catch (error) {
    console.error('❌ Error auto-creating memory:', error);
    return null;
  }
};

/**
 * 성취 언락
 */
const unlockAchievement = async (relationId, achievementId) => {
  try {
    const achievement = ACHIEVEMENTS[achievementId];
    if (!achievement) return null;

    // 이미 달성했는지 확인
    const existing = await prisma.relationAchievement.findUnique({
      where: {
        relationId_achievementId: {
          relationId,
          achievementId
        }
      }
    });

    if (existing) return existing;

    // 새 성취 생성
    const newAchievement = await prisma.relationAchievement.create({
      data: {
        relationId,
        achievementId,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        category: achievement.category
      }
    });

    console.log(`🏆 Achievement unlocked: ${achievement.title}`);
    return newAchievement;
  } catch (error) {
    console.error('❌ Error unlocking achievement:', error);
    throw error;
  }
};

/**
 * 성취 조건 확인 및 자동 언락
 */
const checkAndUnlockAchievements = async (relationId) => {
  try {
    const relation = await prisma.relation.findUnique({
      where: { id: relationId },
      include: {
        achievements: true,
        eventLogs: true
      }
    });

    if (!relation) return [];

    const unlockedAchievements = [];
    const currentAchievements = relation.achievements.map(a => a.achievementId);

    // 각 성취 조건 확인
    for (const [achievementId, achievement] of Object.entries(ACHIEVEMENTS)) {
      if (currentAchievements.includes(achievementId)) continue;

      const condition = achievement.unlockCondition;
      let shouldUnlock = true;

      // 단계 조건 확인
      if (condition.stage !== undefined && relation.stage < condition.stage) {
        shouldUnlock = false;
      }

      // 메시지 수 조건 확인
      if (condition.messages !== undefined && relation.totalMessages < condition.messages) {
        shouldUnlock = false;
      }

      // 선물 수 조건 확인
      if (condition.gifts !== undefined) {
        const giftCount = relation.eventLogs.filter(log => 
          log.eventType.includes('gift') && log.deltaScore > 0
        ).length;
        if (giftCount < condition.gifts) {
          shouldUnlock = false;
        }
      }

      // 데이트 수 조건 확인
      if (condition.dates !== undefined) {
        const dateCount = relation.eventLogs.filter(log => 
          log.eventType.includes('date') && log.deltaScore > 0
        ).length;
        if (dateCount < condition.dates) {
          shouldUnlock = false;
        }
      }

      if (shouldUnlock) {
        const newAchievement = await unlockAchievement(relationId, achievementId);
        if (newAchievement) {
          unlockedAchievements.push(newAchievement);
        }
      }
    }

    return unlockedAchievements;
  } catch (error) {
    console.error('❌ Error checking achievements:', error);
    return [];
  }
};

/**
 * 관계 통계 조회
 */
const getRelationStats = async (relationId) => {
  try {
    const relation = await prisma.relation.findUnique({
      where: { id: relationId },
      include: {
        eventLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        memories: {
          orderBy: { createdAt: 'desc' }
        },
        achievements: {
          orderBy: { unlockedAt: 'desc' }
        }
      }
    });

    if (!relation) return null;

    // 통계 계산
    const stats = {
      totalEvents: relation.eventLogs.length,
      positiveEvents: relation.eventLogs.filter(e => e.deltaScore > 0).length,
      negativeEvents: relation.eventLogs.filter(e => e.deltaScore < 0).length,
      giftEvents: relation.eventLogs.filter(e => e.eventType.includes('gift')).length,
      dateEvents: relation.eventLogs.filter(e => e.eventType.includes('date')).length,
      totalMemories: relation.memories.length,
      highlightMemories: relation.memories.filter(m => m.isHighlight).length,
      totalAchievements: relation.achievements.length,
      daysSinceFirstMeet: Math.floor((new Date() - relation.createdAt) / (1000 * 60 * 60 * 24)),
      daysSinceLastEvent: Math.floor((new Date() - relation.lastEventAt) / (1000 * 60 * 60 * 24))
    };

    return {
      relation,
      stats,
      recentEvents: relation.eventLogs,
      memories: relation.memories,
      achievements: relation.achievements
    };
  } catch (error) {
    console.error('❌ Error getting relation stats:', error);
    throw error;
  }
};

/**
 * 특별 이벤트 처리 (향상된 버전)
 */
const processSpecialEvent = async (userId, characterId, eventType, description, metadata = {}) => {
  try {
    // 기존 관계 가져오기
    const relation = await prisma.relation.findUnique({
      where: {
        userId_characterId: { userId, characterId }
      }
    });

    if (!relation) {
      throw new Error('Relation not found');
    }

    // 이벤트 타입별 점수 계산
    const eventScores = {
      flower: 25,
      chocolate: 20,
      jewelry: 50,
      date_cafe: 30,
      date_movie: 35,
      date_dinner: 45,
      surprise: 60,
      confession: 80,
      proposal: 100
    };

    const deltaScore = eventScores[eventType] || 10;

    // 관계 업데이트
    const updatedRelation = await prisma.relation.update({
      where: { id: relation.id },
      data: {
        score: Math.min(1000, relation.score + deltaScore),
        specialEvents: relation.specialEvents + 1,
        lastEventAt: new Date(),
        mood: determineMoodByStage(relation.stage, [{ deltaScore }])
      }
    });

    // 이벤트 로그 생성
    await prisma.relationEventLog.create({
      data: {
        relationId: relation.id,
        eventType: `special_${eventType}`,
        deltaScore,
        description,
        metadata: JSON.stringify(metadata)
      }
    });

    // 자동 추억 생성
    await autoCreateMemory(relation.id, eventType, {
      eventType,
      description,
      ...metadata
    });

    // 성취 확인
    const newAchievements = await checkAndUnlockAchievements(relation.id);

    return {
      relation: updatedRelation,
      deltaScore,
      newAchievements,
      eventType
    };
  } catch (error) {
    console.error('❌ Error processing special event:', error);
    throw error;
  }
};

module.exports = {
  MOODS,
  ACHIEVEMENTS,
  updateMood,
  determineMoodByStage,
  createMemory,
  autoCreateMemory,
  unlockAchievement,
  checkAndUnlockAchievements,
  getRelationStats,
  processSpecialEvent
}; 