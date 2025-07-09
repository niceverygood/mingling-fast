const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateUser } = require('../middleware');

// 하트 잔액 조회
router.get('/balance', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hearts: true }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    res.json({
      success: true,
      data: {
        hearts: user.hearts || 0
      }
    });
  } catch (error) {
    console.error('Error fetching heart balance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 하트 사용 (메시지 전송 시)
router.post('/spend', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hearts: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (user.hearts < amount) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient hearts'
      });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        hearts: {
          decrement: amount
        }
      },
      select: { hearts: true }
    });
    
    // 하트 사용 기록 생성
    await prisma.heartTransaction.create({
      data: {
        userId: userId,
        amount: -amount,
        type: 'spend',
        description: description || 'Message sent',
        balance: updatedUser.hearts
      }
    });
    
    res.json({
      success: true,
      data: {
        hearts: updatedUser.hearts,
        spent: amount
      }
    });
  } catch (error) {
    console.error('Error spending hearts:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 인앱결제로 하트 추가
router.post('/add', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { hearts, transactionId, productId, purchaseDate } = req.body;
    
    console.log('📱 인앱결제 하트 추가 요청:', {
      userId,
      hearts,
      transactionId,
      productId,
      purchaseDate
    });
    
    // 입력 데이터 검증
    if (!hearts || hearts <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid hearts amount'
      });
    }
    
    if (!transactionId || !productId) {
      return res.status(400).json({
        success: false,
        error: 'Missing transaction information'
      });
    }
    
    // 중복 결제 방지 - 동일한 transactionId 확인
    const existingTransaction = await prisma.heartTransaction.findFirst({
      where: {
        transactionId: transactionId,
        type: 'purchase'
      }
    });
    
    if (existingTransaction) {
      console.log('⚠️ 중복 결제 시도 차단:', transactionId);
      return res.status(400).json({
        success: false,
        error: 'Transaction already processed'
      });
    }
    
    // 사용자 확인
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hearts: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    // 트랜잭션으로 하트 추가 및 기록 생성
    const result = await prisma.$transaction(async (prisma) => {
      // 하트 추가
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          hearts: {
            increment: hearts
          }
        },
        select: { hearts: true }
      });
      
      // 결제 기록 생성
      const transaction = await prisma.heartTransaction.create({
        data: {
          userId: userId,
          amount: hearts,
          type: 'purchase',
          description: `인앱결제 - ${productId}`,
          balance: updatedUser.hearts,
          transactionId: transactionId,
          productId: productId,
          purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date()
        }
      });
      
      return {
        user: updatedUser,
        transaction: transaction
      };
    });
    
    console.log('✅ 인앱결제 하트 추가 완료:', {
      userId,
      heartsAdded: hearts,
      newBalance: result.user.hearts,
      transactionId
    });
    
    res.json({
      success: true,
      data: {
        hearts: result.user.hearts,
        added: hearts,
        transactionId: transactionId
      }
    });
  } catch (error) {
    console.error('❌ 인앱결제 하트 추가 실패:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 하트 거래 내역 조회
router.get('/transactions', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    const transactions = await prisma.heartTransaction.findMany({
      where: { userId: userId },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
      select: {
        id: true,
        amount: true,
        type: true,
        description: true,
        balance: true,
        createdAt: true,
        transactionId: true,
        productId: true
      }
    });
    
    res.json({
      success: true,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching heart transactions:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// 웹뷰에서 하트 잔액 실시간 동기화
router.get('/sync', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hearts: true }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    res.json({
      success: true,
      data: {
        hearts: user.hearts || 0,
        syncTime: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error syncing heart balance:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

module.exports = router; 