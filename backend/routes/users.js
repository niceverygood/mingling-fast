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

    // Firebase ID로 사용자 찾기
    let user = await prisma.user.findUnique({
      where: { id: firebaseUserId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        hearts: true,
        joinedAt: true,
        _count: {
          select: {
            characters: true
          }
        }
      }
    });

    if (!user) {
      // 사용자가 없으면 새로 생성
      user = await prisma.user.create({
        data: {
          id: firebaseUserId,
          email: firebaseUserEmail || `${firebaseUserId}@firebase.user`,
          username: firebaseUserEmail?.split('@')[0] || '사용자',
          hearts: 150
        },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          hearts: true,
          joinedAt: true,
          _count: {
            select: {
              characters: true
            }
          }
        }
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
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