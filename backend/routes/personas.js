const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/personas - 모든 페르소나 목록 (현재 사용자)
router.get('/', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const personas = await prisma.persona.findMany({
      where: {
        userId: firebaseUserId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        job: true,
        avatarUrl: true,
        basicInfo: true,
        habits: true,
        appearance: true,
        personality: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(personas);
  } catch (error) {
    console.error('Error fetching personas:', error);
    res.status(500).json({ error: 'Failed to fetch personas' });
  }
});

// GET /api/personas/my - 내 페르소나 목록
router.get('/my', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const personas = await prisma.persona.findMany({
      where: {
        userId: firebaseUserId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        job: true,
        avatarUrl: true,
        basicInfo: true,
        habits: true,
        appearance: true,
        personality: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(personas);
  } catch (error) {
    console.error('Error fetching my personas:', error);
    res.status(500).json({ error: 'Failed to fetch personas' });
  }
});

// POST /api/personas - 새 페르소나 생성
router.post('/', async (req, res) => {
  try {
    const { 
      name, 
      age, 
      gender, 
      job,
      avatarUrl,
      basicInfo,
      habits,
      appearance,
      personality
    } = req.body;

    // 이름은 필수
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const firebaseUserId = req.headers['x-user-id'];
    const firebaseUserEmail = req.headers['x-user-email'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // 사용자가 없으면 생성
    let user = await prisma.user.findUnique({
      where: { id: firebaseUserId }
    });

    if (!user) {
      // 고유한 username 생성
      const baseUsername = firebaseUserEmail?.split('@')[0] || '사용자';
      const timestamp = Date.now();
      const uniqueUsername = `${baseUsername}_${timestamp}`;
      
      user = await prisma.user.create({
        data: {
          id: firebaseUserId,
          email: firebaseUserEmail || `${firebaseUserId}@firebase.user`,
          username: uniqueUsername,
          hearts: 150
        }
      });
    }
    
    const persona = await prisma.persona.create({
      data: {
        name: name.trim(),
        age: age?.trim() || null,
        gender: gender || 'undisclosed',
        job: job?.trim() || null,
        avatarUrl: avatarUrl || null,
        basicInfo: basicInfo?.trim() || null,
        habits: habits?.trim() || null,
        appearance: appearance?.trim() || null,
        personality: personality?.trim() || null,
        userId: firebaseUserId
      },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        job: true,
        avatarUrl: true,
        basicInfo: true,
        habits: true,
        appearance: true,
        personality: true,
        createdAt: true
      }
    });

    res.status(201).json(persona);
  } catch (error) {
    console.error('Error creating persona:', error);
    res.status(500).json({ error: 'Failed to create persona' });
  }
});

// GET /api/personas/:id - 특정 페르소나 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const persona = await prisma.persona.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        job: true,
        avatarUrl: true,
        basicInfo: true,
        habits: true,
        appearance: true,
        personality: true,
        createdAt: true,
        user: {
          select: {
            username: true
          }
        }
      }
    });

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    res.json(persona);
  } catch (error) {
    console.error('Error fetching persona:', error);
    res.status(500).json({ error: 'Failed to fetch persona' });
  }
});

// PUT /api/personas/:id - 페르소나 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      age, 
      gender, 
      job,
      avatarUrl,
      basicInfo,
      habits,
      appearance,
      personality
    } = req.body;

    // 이름은 필수
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const updatedPersona = await prisma.persona.update({
      where: { id },
      data: {
        name: name.trim(),
        age: age?.trim() || null,
        gender: gender || 'undisclosed',
        job: job?.trim() || null,
        avatarUrl: avatarUrl || null,
        basicInfo: basicInfo?.trim() || null,
        habits: habits?.trim() || null,
        appearance: appearance?.trim() || null,
        personality: personality?.trim() || null
      },
      select: {
        id: true,
        name: true,
        age: true,
        gender: true,
        job: true,
        avatarUrl: true,
        basicInfo: true,
        habits: true,
        appearance: true,
        personality: true,
        createdAt: true
      }
    });

    res.json(updatedPersona);
  } catch (error) {
    console.error('Error updating persona:', error);
    res.status(500).json({ error: 'Failed to update persona' });
  }
});

// DELETE /api/personas/:id - 페르소나 삭제 (완전 삭제)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    console.log(`🗑️ 페르소나 삭제 시작: ${id} by user ${firebaseUserId}`);

    // 페르소나 존재 및 소유권 확인
    const persona = await prisma.persona.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        userId: true,
        avatarUrl: true,
        _count: {
          select: {
            chats: true
          }
        }
      }
    });

    if (!persona) {
      return res.status(404).json({ error: 'Persona not found' });
    }

    if (persona.userId !== firebaseUserId) {
      return res.status(403).json({ error: 'You can only delete your own personas' });
    }

    // 관련 데이터가 있는지 확인
    const hasRelatedData = persona._count.chats > 0;
    
    console.log(`📊 페르소나 관련 데이터:`, {
      chats: persona._count.chats,
      hasRelatedData
    });

    // S3에서 이미지 삭제를 위한 함수 import
    const { deleteFileFromS3 } = require('../config/s3');

    // 트랜잭션으로 모든 데이터 삭제
    const result = await prisma.$transaction(async (tx) => {
      // 1. 채팅 관련 데이터 삭제
      if (persona._count.chats > 0) {
        // 이 페르소나로 진행된 채팅의 메시지 삭제
        await tx.message.deleteMany({
          where: {
            chat: {
              personaId: id
            }
          }
        });

        // 이 페르소나로 진행된 채팅 삭제
        await tx.chat.deleteMany({
          where: { personaId: id }
        });
      }

      // 2. 페르소나 삭제
      await tx.persona.delete({
        where: { id }
      });

      return { 
        type: 'deleted',
        message: '페르소나가 완전히 삭제되었습니다.',
        deletedData: {
          chats: persona._count.chats
        }
      };
    });

    // 3. S3에서 이미지 삭제 (트랜잭션 외부에서 실행)
    if (persona.avatarUrl) {
      try {
        await deleteFileFromS3(persona.avatarUrl);
        console.log(`🖼️ S3 이미지 삭제 완료: ${persona.avatarUrl}`);
      } catch (s3Error) {
        console.error('⚠️ S3 이미지 삭제 실패 (무시하고 계속):', s3Error);
        // S3 삭제 실패는 치명적이지 않으므로 무시
      }
    }

    console.log(`✅ 페르소나 삭제 완료:`, {
      personaId: id,
      personaName: persona.name,
      deletedData: result.deletedData
    });

    res.json({
      success: true,
      data: {
        id,
        name: persona.name,
        ...result
      }
    });

  } catch (error) {
    console.error('❌ Error deleting persona:', error);
    
    let errorMessage = 'Failed to delete persona';
    if (error.code === 'P2003') {
      errorMessage = 'Cannot delete persona due to existing dependencies';
    } else if (error.code === 'P2025') {
      errorMessage = 'Persona not found';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 