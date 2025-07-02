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
      user = await prisma.user.create({
        data: {
          id: firebaseUserId,
          email: firebaseUserEmail || `${firebaseUserId}@firebase.user`,
          username: firebaseUserEmail?.split('@')[0] || '사용자',
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
        personality: personality?.trim() || null,
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

// DELETE /api/personas/:id - 페르소나 삭제 (소프트 삭제)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.persona.update({
      where: { id },
      data: {
        isActive: false
      }
    });

    res.json({ message: 'Persona deleted successfully' });
  } catch (error) {
    console.error('Error deleting persona:', error);
    res.status(500).json({ error: 'Failed to delete persona' });
  }
});

module.exports = router; 