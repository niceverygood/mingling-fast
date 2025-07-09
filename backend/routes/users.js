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
              characters: true,
              personas: true,
              chats: true
            }
          }
        }
      });

      // 사용자가 없으면 생성
      if (!user) {
        console.log('🔄 사용자 자동 생성 시작:', { firebaseUserId, firebaseUserEmail });
        
        const baseEmail = firebaseUserEmail || `${firebaseUserId}@firebase.user`;
        const baseUsername = firebaseUserEmail?.split('@')[0] || 'user';
        const uniqueUsername = `${baseUsername}_${Date.now()}`;
        
        user = await prisma.user.create({
          data: {
            id: firebaseUserId,
            email: baseEmail,
            username: uniqueUsername,
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
                characters: true,
                personas: true,
                chats: true
              }
            }
          }
        });
        
        console.log('✅ 사용자 생성 완료:', { 
          userId: user.id, 
          username: user.username, 
          hearts: user.hearts 
        });
      }
      
      res.json(user);
    } catch (error) {
      console.error('❌ 사용자 조회/생성 실패:', error);
      
      // 중복 생성 시도 에러 처리
      if (error.code === 'P2002') {
        console.log('🔄 중복 에러 발생, 사용자 재조회 시도');
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
                characters: true,
                personas: true,
                chats: true
              }
            }
          }
        });
        
        if (user) {
          return res.json(user);
        }
      }
      
      throw error;
    }
  } catch (error) {
    console.error('❌ 사용자 프로필 조회 실패:', error);
    res.status(500).json({ 
      error: '사용자 프로필을 불러올 수 없습니다.',
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