const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/hearts/balance - 하트 잔액 조회
router.get('/balance', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: firebaseUserId },
      select: {
        hearts: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ hearts: user.hearts });
  } catch (error) {
    console.error('Error fetching heart balance:', error);
    res.status(500).json({ error: 'Failed to fetch heart balance' });
  }
});

// POST /api/hearts/charge - 하트 충전
router.post('/charge', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid charge amount' });
    }

    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // 사용자 하트 업데이트
    const updatedUser = await prisma.user.update({
      where: { id: firebaseUserId },
      data: {
        hearts: {
          increment: amount
        }
      },
      select: {
        hearts: true
      }
    });

    // 하트 거래 기록 생성
    await prisma.heartTransaction.create({
      data: {
        userId: firebaseUserId,
        amount: amount,
        type: 'charge',
        description: `${amount} 하트 충전`
      }
    });

    res.json({ 
      success: true, 
      hearts: updatedUser.hearts,
      charged: amount
    });
  } catch (error) {
    console.error('Error charging hearts:', error);
    res.status(500).json({ error: 'Failed to charge hearts' });
  }
});

// POST /api/hearts/spend - 하트 사용
router.post('/spend', async (req, res) => {
  try {
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid spend amount' });
    }

    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // 현재 하트 잔액 확인
    const user = await prisma.user.findUnique({
      where: { id: firebaseUserId },
      select: { hearts: true }
    });

    if (!user || user.hearts < amount) {
      return res.status(400).json({ error: 'Insufficient hearts' });
    }

    // 하트 차감
    const updatedUser = await prisma.user.update({
      where: { id: firebaseUserId },
      data: {
        hearts: {
          decrement: amount
        }
      },
      select: {
        hearts: true
      }
    });

    // 하트 거래 기록 생성
    await prisma.heartTransaction.create({
      data: {
        userId: firebaseUserId,
        amount: -amount,
        type: 'spend',
        description: description || `${amount} 하트 사용`
      }
    });

    res.json({ 
      success: true, 
      hearts: updatedUser.hearts,
      spent: amount
    });
  } catch (error) {
    console.error('Error spending hearts:', error);
    res.status(500).json({ error: 'Failed to spend hearts' });
  }
});

// GET /api/hearts/transactions - 하트 거래 내역 조회
router.get('/transactions', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const transactions = await prisma.heartTransaction.findMany({
      where: {
        userId: firebaseUserId
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching heart transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

module.exports = router; 