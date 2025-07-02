const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/conversations - 대화 목록 조회 (쿼리 파라미터로 필터링)
router.get('/', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'];
    const { characterId, personaId } = req.query;
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // 쿼리 조건 구성
    const whereClause = {
      userId: firebaseUserId,
      isActive: true
    };

    if (characterId) {
      whereClause.characterId = characterId;
    }

    if (personaId && personaId !== 'user') {
      whereClause.personaId = personaId;
    } else if (personaId === 'user') {
      whereClause.personaId = null;
    }

    const conversations = await prisma.chat.findMany({
      where: whereClause,
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        persona: {
          select: {
            id: true,
            name: true
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            content: true,
            createdAt: true,
            isFromUser: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// POST /api/conversations - 새 대화 시작
router.post('/', async (req, res) => {
  try {
    const { characterId, personaId } = req.body;
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    if (!characterId) {
      return res.status(400).json({ error: 'Character ID is required' });
    }

    // 캐릭터 존재 확인
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    // 페르소나 존재 확인 (선택사항)
    if (personaId && personaId !== 'user') {
      const persona = await prisma.persona.findUnique({
        where: { id: personaId }
      });

      if (!persona) {
        return res.status(404).json({ error: 'Persona not found' });
      }
    }

    // 기존 대화 확인 (중복 방지)
    const existingConversation = await prisma.chat.findFirst({
      where: {
        userId: firebaseUserId,
        characterId,
        personaId: personaId === 'user' ? null : personaId,
        isActive: true
      }
    });

    if (existingConversation) {
      return res.json(existingConversation);
    }

    // 새 대화 생성
    const conversation = await prisma.chat.create({
      data: {
        userId: firebaseUserId,
        characterId,
        personaId: personaId === 'user' ? null : personaId,
        lastMessage: '안녕하세요! 새로운 대화를 시작해볼까요?',
        lastMessageAt: new Date()
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        persona: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(conversation);
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
});

// GET /api/conversations/:id/messages - 특정 대화의 메시지들 조회
router.get('/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // 권한 확인
    const conversation = await prisma.chat.findFirst({
      where: {
        id,
        userId: firebaseUserId
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await prisma.message.findMany({
      where: {
        chatId: id
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        content: true,
        isFromUser: true,
        createdAt: true
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching conversation messages:', error);
    res.status(500).json({ error: 'Failed to fetch conversation messages' });
  }
});

module.exports = router; 