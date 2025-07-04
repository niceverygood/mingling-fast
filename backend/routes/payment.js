const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const router = express.Router();
const prisma = new PrismaClient();

// 포트원 설정
const PORTONE_API_URL = 'https://api.iamport.kr';
// 임시로 하드코딩 (실제 운영에서는 환경변수 사용)
const IMP_KEY = process.env.PORTONE_API_KEY || 'test_api_key'; // 포트원 API Key
const IMP_SECRET = process.env.PORTONE_API_SECRET || 'test_api_secret'; // 포트원 API Secret

// 포트원 액세스 토큰 획득
async function getPortoneAccessToken() {
  try {
    const response = await axios.post(`${PORTONE_API_URL}/users/getToken`, {
      imp_key: IMP_KEY,
      imp_secret: IMP_SECRET
    });
    
    return response.data.response.access_token;
  } catch (error) {
    console.error('❌ 포트원 토큰 획득 실패:', error);
    throw new Error('결제 시스템 연결 실패');
  }
}

// 결제 검증
router.post('/verify', async (req, res) => {
  try {
    const { imp_uid, merchant_uid } = req.body;
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    if (!imp_uid || !merchant_uid) {
      return res.status(400).json({ error: '결제 정보가 누락되었습니다' });
    }

    console.log('💳 결제 검증 요청:', { imp_uid, merchant_uid, userId: firebaseUserId });

    // 테스트 결제 처리 또는 포트원 API 키 없을 때
    if (imp_uid.startsWith('test_imp_') || !IMP_KEY || !IMP_SECRET || IMP_KEY === 'test_api_key') {
      console.log('🧪 테스트 결제 검증 중... (API 키 없음 또는 테스트 모드)');
      
      // 이미 처리된 결제인지 확인
      const existingTransaction = await prisma.heartTransaction.findFirst({
        where: {
          impUid: imp_uid
        }
      });

      if (existingTransaction) {
        return res.status(400).json({ error: '이미 처리된 결제입니다' });
      }

      // 테스트 결제 정보 저장
      const transaction = await prisma.heartTransaction.create({
        data: {
          userId: firebaseUserId,
          impUid: imp_uid,
          merchantUid: merchant_uid,
          amount: 1000, // 테스트 금액
          status: 'verified',
          paymentMethod: 'test',
          paidAt: new Date()
        }
      });

      return res.json({
        success: true,
        transaction: transaction,
        paymentData: {
          amount: 1000,
          status: 'paid',
          paidAt: Math.floor(Date.now() / 1000)
        }
      });
    }

    // 포트원에서 결제 정보 조회
    const accessToken = await getPortoneAccessToken();
    
    const paymentResponse = await axios.get(
      `${PORTONE_API_URL}/payments/${imp_uid}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const paymentData = paymentResponse.data.response;
    
    if (!paymentData) {
      return res.status(404).json({ error: '결제 정보를 찾을 수 없습니다' });
    }

    // 결제 상태 확인
    if (paymentData.status !== 'paid') {
      return res.status(400).json({ 
        error: '결제가 완료되지 않았습니다',
        status: paymentData.status
      });
    }

    // 이미 처리된 결제인지 확인
    const existingTransaction = await prisma.heartTransaction.findFirst({
      where: {
        impUid: imp_uid
      }
    });

    if (existingTransaction) {
      return res.status(400).json({ error: '이미 처리된 결제입니다' });
    }

    // 결제 정보 저장
    const transaction = await prisma.heartTransaction.create({
      data: {
        userId: firebaseUserId,
        impUid: imp_uid,
        merchantUid: merchant_uid,
        amount: paymentData.amount,
        status: 'verified',
        paymentMethod: paymentData.pay_method,
        paidAt: new Date(paymentData.paid_at * 1000)
      }
    });

    console.log('✅ 결제 검증 완료:', transaction);

    res.json({
      success: true,
      transaction: transaction,
      paymentData: {
        amount: paymentData.amount,
        status: paymentData.status,
        paidAt: paymentData.paid_at
      }
    });

  } catch (error) {
    console.error('❌ 결제 검증 실패:', error);
    res.status(500).json({ 
      error: '결제 검증 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

// 하트 구매 완료 처리
router.post('/hearts/purchase', async (req, res) => {
  try {
    const { 
      imp_uid, 
      merchant_uid, 
      product_id, 
      heart_amount, 
      paid_amount 
    } = req.body;
    
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    console.log('💖 하트 구매 처리:', {
      userId: firebaseUserId,
      productId: product_id,
      heartAmount: heart_amount,
      paidAmount: paid_amount
    });

    // 결제 검증 확인
    const transaction = await prisma.heartTransaction.findFirst({
      where: {
        impUid: imp_uid,
        userId: firebaseUserId,
        status: 'verified'
      }
    });

    if (!transaction) {
      return res.status(400).json({ error: '검증되지 않은 결제입니다' });
    }

    // 결제 금액 확인
    if (transaction.amount !== paid_amount) {
      return res.status(400).json({ error: '결제 금액이 일치하지 않습니다' });
    }

    // 사용자 정보 가져오기
    let user = await prisma.user.findUnique({
      where: { id: firebaseUserId }
    });

    if (!user) {
      // 사용자 자동 생성
      user = await prisma.user.create({
        data: {
          id: firebaseUserId,
          email: req.headers['x-user-email'] || `${firebaseUserId}@firebase.user`,
          username: req.headers['x-user-email']?.split('@')[0] || '사용자',
          hearts: heart_amount // 구매한 하트로 시작
        }
      });
    } else {
      // 기존 사용자 하트 추가
      user = await prisma.user.update({
        where: { id: firebaseUserId },
        data: {
          hearts: {
            increment: heart_amount
          }
        }
      });
    }

    // 거래 완료 처리
    await prisma.heartTransaction.update({
      where: { id: transaction.id },
      data: {
        status: 'completed',
        heartAmount: heart_amount,
        completedAt: new Date()
      }
    });

    console.log('✅ 하트 지급 완료:', {
      userId: firebaseUserId,
      addedHearts: heart_amount,
      newBalance: user.hearts
    });

    res.json({
      success: true,
      addedHearts: heart_amount,
      newBalance: user.hearts,
      transaction: {
        id: transaction.id,
        impUid: imp_uid,
        amount: paid_amount
      }
    });

  } catch (error) {
    console.error('❌ 하트 구매 처리 실패:', error);
    res.status(500).json({ 
      error: '하트 지급 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

// 결제 내역 조회
router.get('/history', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const transactions = await prisma.heartTransaction.findMany({
      where: {
        userId: firebaseUserId,
        status: 'completed'
      },
      orderBy: {
        completedAt: 'desc'
      },
      take: 20 // 최근 20개
    });

    res.json(transactions);

  } catch (error) {
    console.error('❌ 결제 내역 조회 실패:', error);
    res.status(500).json({ 
      error: '결제 내역 조회 실패',
      details: error.message
    });
  }
});

// 환불 요청 (관리자용)
router.post('/refund', async (req, res) => {
  try {
    const { imp_uid, reason } = req.body;
    
    // 관리자 권한 확인 (추후 구현)
    // if (!isAdmin(req.headers['x-user-id'])) {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }

    const accessToken = await getPortoneAccessToken();
    
    // 포트원 환불 요청
    const refundResponse = await axios.post(
      `${PORTONE_API_URL}/payments/cancel`,
      {
        imp_uid: imp_uid,
        reason: reason || '관리자 환불'
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    if (refundResponse.data.code === 0) {
      // 환불 성공 - 트랜잭션 상태 업데이트
      await prisma.heartTransaction.updateMany({
        where: { impUid: imp_uid },
        data: { 
          status: 'refunded',
          refundedAt: new Date()
        }
      });

      res.json({
        success: true,
        message: '환불이 완료되었습니다'
      });
    } else {
      throw new Error(refundResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 환불 처리 실패:', error);
    res.status(500).json({ 
      error: '환불 처리 실패',
      details: error.message
    });
  }
});

module.exports = router; 