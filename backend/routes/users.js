const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/users/profile - 사용자 프로필 조회
router.get('/profile', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'];
    const firebaseUserEmail = req.headers['x-user-email'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    console.log('👤 사용자 프로필 조회:', { firebaseUserId, firebaseUserEmail });

    // Firebase ID로 사용자 찾기 또는 생성 (upsert 패턴)
    let user;
    
    try {
      // 먼저 사용자 조회
      user = await prisma.user.findUnique({
        where: { id: firebaseUserId },
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          hearts: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              characters: true
            }
          }
        }
      });

      if (!user) {
        console.log('👤 사용자 자동 생성 중...', { firebaseUserId, firebaseUserEmail });
        
        // 안전한 이메일 및 사용자명 생성
        const safeEmail = firebaseUserEmail || `${firebaseUserId}@auto.mingling`;
        const baseUsername = firebaseUserEmail?.split('@')[0] || 'user';
        const safeUsername = `${baseUsername}_${Date.now()}`;
        
        // upsert 패턴으로 안전하게 생성
        user = await prisma.user.upsert({
          where: { id: firebaseUserId },
          update: {
            // 이미 존재하면 업데이트하지 않음
          },
          create: {
            id: firebaseUserId,
            email: safeEmail,
            username: safeUsername,
            hearts: 150
          },
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            hearts: true,
            createdAt: true,
            updatedAt: true,
            _count: {
              select: {
                characters: true
              }
            }
          }
        });
        
        console.log('✅ 사용자 자동 생성 완료:', user);
      } else {
        console.log('✅ 기존 사용자 발견:', { id: user.id, username: user.username });
      }
    } catch (createError) {
      console.error('❌ 사용자 처리 실패:', createError);
      
      // 최후의 수단: 다시 조회
      user = await prisma.user.findUnique({
        where: { id: firebaseUserId },
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
          hearts: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              characters: true
            }
          }
        }
      });
      
      if (!user) {
        return res.status(500).json({ 
          error: '사용자 생성에 실패했습니다',
          details: createError.message
        });
      }
    }

    res.json(user);
  } catch (error) {
    console.error('❌ 사용자 프로필 조회 실패:', error);
    res.status(500).json({ 
      error: 'Failed to fetch user profile',
      details: error.message
    });
  }
});

// PUT /api/users/profile - 사용자 프로필 업데이트
router.put('/profile', async (req, res) => {
  try {
    const { username, avatarUrl } = req.body;
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: firebaseUserId },
      data: {
        username,
        avatarUrl
      },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        hearts: true,
        joinedAt: true
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

module.exports = router; 