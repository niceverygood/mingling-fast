const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
// const favorabilityEngine = require('../services/favorabilityEngine');

const prisma = new PrismaClient();

console.log('🔧 Relations router loaded successfully');

// 테스트 라우트
router.get('/test', (req, res) => {
  console.log('✅ Relations test route called');
  res.json({
    success: true,
    message: 'Relations route is working perfectly!',
    timestamp: new Date().toISOString()
  });
});

// 모든 관계 조회
router.get('/', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';
    console.log(`📊 Getting all relations for user ${firebaseUserId}`);

    const relations = await prisma.relation.findMany({
      where: {
        userId: firebaseUserId
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      },
      orderBy: {
        score: 'desc'
      }
    });

    res.json({
      success: true,
      data: relations,
      count: relations.length
    });
  } catch (error) {
    console.error('❌ Error getting all relations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get relations',
      details: error.message
    });
  }
});

// 특정 캐릭터와의 관계 조회
router.get('/:characterId', async (req, res) => {
  try {
    const { characterId } = req.params;
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';

    console.log(`📊 Getting relation for user ${firebaseUserId} with character ${characterId}`);

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
            avatarUrl: true
          }
        }
      }
    });

    if (!relation) {
      // 관계가 없으면 기본 관계 생성
      const newRelation = await prisma.relation.create({
        data: {
          userId: firebaseUserId,
          characterId,
          score: 0,
          stage: 0
        },
        include: {
          character: {
            select: {
              id: true,
              name: true,
              avatarUrl: true
            }
          }
        }
      });

      return res.json({
        success: true,
        data: newRelation,
        isNew: true
      });
    }

    res.json({
      success: true,
      data: relation,
      isNew: false
    });
  } catch (error) {
    console.error('❌ Error getting relation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get relation',
      details: error.message
    });
  }
});

// 이벤트 처리
router.post('/:characterId/event', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { eventType, deltaScore = 10 } = req.body;
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';

    console.log(`🎯 Processing event for character ${characterId}, event: ${eventType}, delta: ${deltaScore}`);

    const updatedRelation = await prisma.relation.upsert({
      where: {
        userId_characterId: {
          userId: firebaseUserId,
          characterId
        }
      },
      update: {
        score: {
          increment: deltaScore
        },
        updatedAt: new Date()
      },
      create: {
        userId: firebaseUserId,
        characterId,
        score: Math.max(0, deltaScore),
        stage: 0
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        }
      }
    });

    // 이벤트 로그 생성
    await prisma.relationEventLog.create({
      data: {
        relationId: updatedRelation.id,
        eventType,
        deltaScore,
        description: `Event: ${eventType}`,
        createdAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        relation: updatedRelation,
        deltaScore,
        eventType
      }
    });
  } catch (error) {
    console.error('❌ Error processing event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to process event',
      details: error.message
    });
  }
});

// 호감도 히스토리 조회
router.get('/:characterId/history', async (req, res) => {
  try {
    const { characterId } = req.params;
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';
    const { limit = 20, offset = 0 } = req.query;

    console.log(`📈 Getting relation history for user ${firebaseUserId} with character ${characterId}`);

    // 관계 찾기
    const relation = await prisma.relation.findUnique({
      where: {
        userId_characterId: {
          userId: firebaseUserId,
          characterId
        }
      }
    });

    if (!relation) {
      return res.json({
        success: true,
        data: {
          events: [],
          total: 0
        }
      });
    }

    // 이벤트 로그 조회
    const events = await prisma.relationEventLog.findMany({
      where: {
        relationId: relation.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.relationEventLog.count({
      where: {
        relationId: relation.id
      }
    });

    res.json({
      success: true,
      data: {
        events,
        total,
        currentRelation: {
          score: relation.score,
          stage: relation.stage
          // stageInfo: favorabilityEngine.STAGES[relation.stage]
        }
      }
    });
  } catch (error) {
    console.error('❌ Error getting relation history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get relation history'
    });
  }
});

// 수동 점수 조정 (관리자용 또는 테스트용)
router.post('/:characterId/adjust', async (req, res) => {
  try {
    const { characterId } = req.params;
    const { deltaScore, reason } = req.body;
    const firebaseUserId = req.headers['x-user-id'] || 'test-user-123';

    console.log(`🔧 Manual score adjustment for user ${firebaseUserId} with character ${characterId}: ${deltaScore}`);

    // const result = await favorabilityEngine.updateFavorability(
    //   firebaseUserId,
    //   characterId,
    //   deltaScore,
    //   'manual_adjustment',
    //   reason || 'Manual adjustment'
    // );
    
    const result = {
      message: 'Manual adjustment temporarily disabled',
      deltaScore,
      reason
    };

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('❌ Error adjusting score:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust score'
    });
  }
});

module.exports = router; 