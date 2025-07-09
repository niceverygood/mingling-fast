const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const relationshipService = require('../services/relationshipService');

const prisma = new PrismaClient();

// 모든 관계 조회
router.get('/', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';
    
    console.log('🔍 Relations API - 사용자 ID:', firebaseUserId);
    console.log('🔍 Relations API - 모든 헤더:', req.headers);
    
    const relations = await prisma.relation.findMany({
      where: { userId: firebaseUserId },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            description: true
          }
        },
        achievements: {
          select: {
            id: true,
            achievementId: true,
            title: true,
            description: true,
            icon: true,
            category: true,
            unlockedAt: true
          },
          orderBy: { unlockedAt: 'desc' }
        },
        memories: {
          select: {
            id: true,
            title: true,
            description: true,
            memoryType: true,
            importance: true,
            isHighlight: true,
            createdAt: true
          },
          where: { isHighlight: true },
          orderBy: { createdAt: 'desc' },
          take: 3
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({
      success: true,
      data: relations
    });
  } catch (error) {
    console.error('❌ Error fetching relations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch relations'
    });
  }
});

// 특정 캐릭터와의 관계 조회 (상세 정보)
router.get('/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';
    
    console.log('🔍 Relations API - 캐릭터 ID:', characterId);
    console.log('🔍 Relations API - 사용자 ID:', firebaseUserId);
    console.log('🔍 Relations API - 모든 헤더:', req.headers);

    const relation = await prisma.relation.findUnique({
      where: {
        userId_characterId: {
          userId: firebaseUserId,
          characterId
        }
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            description: true,
            personality: true
          }
        },
        eventLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20
        },
        memories: {
          orderBy: { createdAt: 'desc' }
        },
        achievements: {
          orderBy: { unlockedAt: 'desc' }
        }
      }
    });

    if (!relation) {
      // 관계가 없으면 새로 생성
      const newRelation = await prisma.relation.create({
        data: {
          userId: firebaseUserId,
          characterId,
          score: 0,
          stage: 0,
          mood: 'neutral'
        },
        include: {
          character: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              description: true,
              personality: true
            }
          },
          eventLogs: true,
          memories: true,
          achievements: true
        }
      });

      // 첫 만남 성취 언락
      await relationshipService.unlockAchievement(newRelation.id, 'first_meet');

      return res.json({
        success: true,
        data: {
          ...newRelation,
          progressInStage: 0,
          maxProgressInStage: 149
        }
      });
    }

    // 호감도 진행률 계산
    const STAGES = {
      0: { min: 0, max: 149 },
      1: { min: 150, max: 299 },
      2: { min: 300, max: 499 },
      3: { min: 500, max: 699 },
      4: { min: 700, max: 849 },
      5: { min: 850, max: 929 },
      6: { min: 930, max: 1000 }
    };

    const currentStage = STAGES[relation.stage] || STAGES[0];
    const progressInStage = relation.score - currentStage.min;
    const maxProgressInStage = currentStage.max - currentStage.min + 1;

    res.json({
      success: true,
      data: {
        ...relation,
        progressInStage,
        maxProgressInStage
      }
    });
  } catch (error) {
    console.error('❌ Error fetching relation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch relation'
    });
  }
});

// 관계 통계 조회
router.get('/:characterId/stats', async (req, res) => {
  try {
    const { characterId } = req.params;
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';

    const relation = await prisma.relation.findUnique({
      where: {
        userId_characterId: {
          userId: firebaseUserId,
          characterId
        }
      }
    });

    if (!relation) {
      return res.status(404).json({
        success: false,
        error: 'Relation not found'
      });
    }

    const stats = await relationshipService.getRelationStats(relation.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Error fetching relation stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch relation stats'
    });
  }
});

// 특별 이벤트 처리 (향상된 버전)
router.post('/:characterId/event', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { eventType, description, metadata } = req.body;
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';

    console.log(`🎯 Processing special event: ${eventType} for character ${characterId}`);

    const result = await relationshipService.processSpecialEvent(
      firebaseUserId,
      characterId,
      eventType,
      description || `Special event: ${eventType}`,
      metadata || {}
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error processing special event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process special event',
      details: error.message
    });
  }
});

// 추억 조회
router.get('/:characterId/memories', async (req, res) => {
  try {
    const { characterId } = req.params;
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';
    const { type, highlight } = req.query;

    const relation = await prisma.relation.findUnique({
      where: {
        userId_characterId: {
          userId: firebaseUserId,
          characterId
        }
      }
    });

    if (!relation) {
      return res.status(404).json({
        success: false,
        error: 'Relation not found'
      });
    }

    const whereClause = { relationId: relation.id };
    if (type) whereClause.memoryType = type;
    if (highlight === 'true') whereClause.isHighlight = true;

    const memories = await prisma.relationMemory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: memories
    });
  } catch (error) {
    console.error('❌ Error fetching memories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch memories'
    });
  }
});

// 성취 조회
router.get('/:characterId/achievements', async (req, res) => {
  try {
    const { characterId } = req.params;
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';

    const relation = await prisma.relation.findUnique({
      where: {
        userId_characterId: {
          userId: firebaseUserId,
          characterId
        }
      }
    });

    if (!relation) {
      return res.status(404).json({
        success: false,
        error: 'Relation not found'
      });
    }

    const achievements = await prisma.relationAchievement.findMany({
      where: { relationId: relation.id },
      orderBy: { unlockedAt: 'desc' }
    });

    // 전체 성취 목록과 달성 여부 반환
    const allAchievements = Object.values(relationshipService.ACHIEVEMENTS).map(achievement => ({
      ...achievement,
      unlocked: achievements.some(a => a.achievementId === achievement.id),
      unlockedAt: achievements.find(a => a.achievementId === achievement.id)?.unlockedAt || null
    }));

    res.json({
      success: true,
      data: {
        unlockedAchievements: achievements,
        allAchievements
      }
    });
  } catch (error) {
    console.error('❌ Error fetching achievements:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch achievements'
    });
  }
});

// 감정 상태 업데이트
router.post('/:characterId/mood', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { mood, reason } = req.body;
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';

    const relation = await prisma.relation.findUnique({
      where: {
        userId_characterId: {
          userId: firebaseUserId,
          characterId
        }
      }
    });

    if (!relation) {
      return res.status(404).json({
        success: false,
        error: 'Relation not found'
      });
    }

    const updatedRelation = await relationshipService.updateMood(relation.id, mood, reason);

    res.json({
      success: true,
      data: updatedRelation
    });
  } catch (error) {
    console.error('❌ Error updating mood:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update mood'
    });
  }
});

// 추억 생성
router.post('/:characterId/memory', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { title, description, type, importance, isHighlight, messageId } = req.body;
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';

    const relation = await prisma.relation.findUnique({
      where: {
        userId_characterId: {
          userId: firebaseUserId,
          characterId
        }
      }
    });

    if (!relation) {
      return res.status(404).json({
        success: false,
        error: 'Relation not found'
      });
    }

    const memory = await relationshipService.createMemory(relation.id, {
      title,
      description,
      type,
      importance,
      isHighlight,
      messageId
    });

    res.json({
      success: true,
      data: memory
    });
  } catch (error) {
    console.error('❌ Error creating memory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create memory'
    });
  }
});

// 관계 이벤트 히스토리 조회
router.get('/:characterId/history', async (req, res) => {
  try {
    const { characterId } = req.params;
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';
    const { limit = 20, offset = 0 } = req.query;

    const relation = await prisma.relation.findUnique({
      where: {
        userId_characterId: {
          userId: firebaseUserId,
          characterId
        }
      }
    });

    if (!relation) {
      return res.status(404).json({
        success: false,
        error: 'Relation not found'
      });
    }

    const events = await prisma.relationEventLog.findMany({
      where: { relationId: relation.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    res.json({
      success: true,
      data: events
    });
  } catch (error) {
    console.error('❌ Error fetching event history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event history'
    });
  }
});

module.exports = router; 