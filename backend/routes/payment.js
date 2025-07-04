const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const router = express.Router();
const prisma = new PrismaClient();

console.log('🔧 Payment 라우트 초기화');

// 포트원 설정
const PORTONE_API_URL = 'https://api.iamport.kr';
// 임시로 하드코딩 (실제 운영에서는 환경변수 사용)
const IMP_KEY = process.env.PORTONE_API_KEY || 'test_api_key'; // 포트원 API Key
const IMP_SECRET = process.env.PORTONE_API_SECRET || 'test_api_secret'; // 포트원 API Secret

console.log('📋 포트원 설정 정보:', {
  PORTONE_API_URL,
  IMP_KEY: IMP_KEY ? (IMP_KEY === 'test_api_key' ? 'TEST_KEY' : '설정됨') : '없음',
  IMP_SECRET: IMP_SECRET ? (IMP_SECRET === 'test_api_secret' ? 'TEST_SECRET' : '설정됨') : '없음'
});

// 포트원 액세스 토큰 획득
async function getPortoneAccessToken() {
  console.log('🔑 포트원 액세스 토큰 획득 시작');
  
  try {
    console.log('🌐 포트원 토큰 요청:', {
      url: `${PORTONE_API_URL}/users/getToken`,
      imp_key: IMP_KEY ? '설정됨' : '없음',
      imp_secret: IMP_SECRET ? '설정됨' : '없음'
    });
    
    const response = await axios.post(`${PORTONE_API_URL}/users/getToken`, {
      imp_key: IMP_KEY,
      imp_secret: IMP_SECRET
    });
    
    console.log('📨 포트원 토큰 응답:', {
      status: response.status,
      data: response.data
    });
    
    const accessToken = response.data.response.access_token;
    console.log('✅ 포트원 액세스 토큰 획득 성공:', accessToken ? '토큰 획득됨' : '토큰 없음');
    
    return accessToken;
  } catch (error) {
    console.error('❌ 포트원 토큰 획득 실패:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        data: error.config?.data
      }
    });
    throw new Error('결제 시스템 연결 실패');
  }
}

// 결제 검증
router.post('/verify', async (req, res) => {
  console.log('🔍 결제 검증 요청 시작');
  
  try {
    const { imp_uid, merchant_uid } = req.body;
    const firebaseUserId = req.headers['x-user-id'];
    
    console.log('📋 검증 요청 정보:', {
      imp_uid,
      merchant_uid,
      firebaseUserId,
      headers: req.headers
    });
    
    if (!firebaseUserId) {
      console.error('❌ 사용자 ID 없음');
      return res.status(401).json({ error: 'User ID required' });
    }

    if (!imp_uid || !merchant_uid) {
      console.error('❌ 결제 정보 누락:', { imp_uid, merchant_uid });
      return res.status(400).json({ error: '결제 정보가 누락되었습니다' });
    }

    console.log('💳 결제 검증 시작:', { imp_uid, merchant_uid, userId: firebaseUserId });

    // 테스트 결제 처리 또는 포트원 API 키 없을 때
    if (imp_uid.startsWith('test_imp_') || !IMP_KEY || !IMP_SECRET || IMP_KEY === 'test_api_key') {
      console.log('🧪 테스트 결제 검증 모드');
      console.log('🔍 테스트 모드 조건:', {
        isTestImpUid: imp_uid.startsWith('test_imp_'),
        hasImpKey: !!IMP_KEY,
        hasImpSecret: !!IMP_SECRET,
        isTestKey: IMP_KEY === 'test_api_key'
      });
      
      // 이미 처리된 결제인지 확인
      console.log('🔍 기존 거래 확인 중...');
      const existingTransaction = await prisma.heartTransaction.findFirst({
        where: {
          impUid: imp_uid
        }
      });

      if (existingTransaction) {
        console.error('❌ 이미 처리된 결제:', existingTransaction);
        return res.status(400).json({ error: '이미 처리된 결제입니다' });
      }

      // 테스트 결제 정보 저장
      console.log('💾 테스트 결제 정보 저장 중...');
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

      console.log('✅ 테스트 결제 검증 완료:', transaction);
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
    console.log('🔑 포트원 액세스 토큰 획득 중...');
    const accessToken = await getPortoneAccessToken();
    
    console.log('🌐 포트원 결제 정보 조회 중...');
    const paymentUrl = `${PORTONE_API_URL}/payments/${imp_uid}`;
    console.log('📡 결제 정보 요청 URL:', paymentUrl);
    
    const paymentResponse = await axios.get(paymentUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    console.log('📨 포트원 결제 정보 응답:', {
      status: paymentResponse.status,
      data: paymentResponse.data
    });

    const paymentData = paymentResponse.data.response;
    
    if (!paymentData) {
      console.error('❌ 결제 정보 없음:', paymentResponse.data);
      return res.status(404).json({ error: '결제 정보를 찾을 수 없습니다' });
    }

    console.log('📋 결제 상태 확인:', {
      status: paymentData.status,
      amount: paymentData.amount,
      merchant_uid: paymentData.merchant_uid,
      pay_method: paymentData.pay_method
    });

    // 결제 상태 확인
    if (paymentData.status !== 'paid') {
      console.error('❌ 결제 미완료:', {
        status: paymentData.status,
        expected: 'paid'
      });
      return res.status(400).json({ 
        error: '결제가 완료되지 않았습니다',
        status: paymentData.status
      });
    }

    // 이미 처리된 결제인지 확인
    console.log('🔍 기존 거래 확인 중...');
    const existingTransaction = await prisma.heartTransaction.findFirst({
      where: {
        impUid: imp_uid
      }
    });

    if (existingTransaction) {
      console.error('❌ 이미 처리된 결제:', existingTransaction);
      return res.status(400).json({ error: '이미 처리된 결제입니다' });
    }

    // 결제 정보 저장
    console.log('💾 결제 정보 저장 중...');
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
    console.error('❌ 결제 검증 실패:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(500).json({ 
      error: '결제 검증 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

// 하트 구매 완료 처리
router.post('/hearts/purchase', async (req, res) => {
  console.log('💖 하트 구매 완료 처리 시작');
  
  try {
    const { 
      imp_uid, 
      merchant_uid, 
      product_id, 
      heart_amount, 
      paid_amount 
    } = req.body;
    
    const firebaseUserId = req.headers['x-user-id'];
    
    console.log('📋 하트 구매 요청 정보:', {
      imp_uid,
      merchant_uid,
      product_id,
      heart_amount,
      paid_amount,
      firebaseUserId,
      headers: req.headers
    });
    
    if (!firebaseUserId) {
      console.error('❌ 사용자 ID 없음');
      return res.status(401).json({ error: 'User ID required' });
    }

    console.log('💖 하트 구매 처리:', {
      userId: firebaseUserId,
      productId: product_id,
      heartAmount: heart_amount,
      paidAmount: paid_amount
    });

    // 결제 검증 확인
    console.log('🔍 결제 검증 상태 확인 중...');
    const transaction = await prisma.heartTransaction.findFirst({
      where: {
        impUid: imp_uid,
        userId: firebaseUserId,
        status: 'verified'
      }
    });

    if (!transaction) {
      console.error('❌ 검증되지 않은 결제:', {
        imp_uid,
        userId: firebaseUserId,
        searchedStatus: 'verified'
      });
      
      // 모든 관련 거래 조회하여 디버깅
      const allTransactions = await prisma.heartTransaction.findMany({
        where: {
          OR: [
            { impUid: imp_uid },
            { userId: firebaseUserId }
          ]
        }
      });
      
      console.log('🔍 관련 거래 내역:', allTransactions);
      
      return res.status(400).json({ error: '검증되지 않은 결제입니다' });
    }

    console.log('✅ 검증된 거래 확인:', transaction);

    // 결제 금액 확인
    if (transaction.amount !== paid_amount) {
      console.error('❌ 결제 금액 불일치:', {
        transactionAmount: transaction.amount,
        paidAmount: paid_amount
      });
      return res.status(400).json({ error: '결제 금액이 일치하지 않습니다' });
    }

    // 사용자 정보 가져오기
    console.log('👤 사용자 정보 조회 중...');
    let user = await prisma.user.findUnique({
      where: { id: firebaseUserId }
    });

    if (!user) {
      console.log('👤 사용자 자동 생성 중...');
      // 사용자 자동 생성
      user = await prisma.user.create({
        data: {
          id: firebaseUserId,
          email: req.headers['x-user-email'] || `${firebaseUserId}@firebase.user`,
          username: req.headers['x-user-email']?.split('@')[0] || '사용자',
          hearts: heart_amount // 구매한 하트로 시작
        }
      });
      console.log('✅ 사용자 생성 완료:', user);
    } else {
      console.log('👤 기존 사용자 하트 추가 중...');
      console.log('📊 현재 하트:', user.hearts);
      // 기존 사용자 하트 추가
      user = await prisma.user.update({
        where: { id: firebaseUserId },
        data: {
          hearts: {
            increment: heart_amount
          }
        }
      });
      console.log('✅ 하트 추가 완료 - 새 잔액:', user.hearts);
    }

    // 거래 완료 처리
    console.log('💾 거래 완료 처리 중...');
    const completedTransaction = await prisma.heartTransaction.update({
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
      newBalance: user.hearts,
      transactionId: completedTransaction.id
    });

    res.json({
      success: true,
      addedHearts: heart_amount,
      newBalance: user.hearts,
      transaction: {
        id: completedTransaction.id,
        impUid: imp_uid,
        amount: paid_amount
      }
    });

  } catch (error) {
    console.error('❌ 하트 구매 처리 실패:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: '하트 지급 중 오류가 발생했습니다',
      details: error.message
    });
  }
});

// 결제 내역 조회
router.get('/history', async (req, res) => {
  console.log('📊 결제 내역 조회 시작');
  
  try {
    const firebaseUserId = req.headers['x-user-id'];
    
    console.log('📋 내역 조회 요청:', {
      firebaseUserId,
      headers: req.headers
    });
    
    if (!firebaseUserId) {
      console.error('❌ 사용자 ID 없음');
      return res.status(401).json({ error: 'User ID required' });
    }

    console.log('🔍 거래 내역 조회 중...');
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

    console.log('📊 조회된 거래 내역:', {
      count: transactions.length,
      transactions: transactions.map(t => ({
        id: t.id,
        impUid: t.impUid,
        amount: t.amount,
        heartAmount: t.heartAmount,
        completedAt: t.completedAt
      }))
    });

    res.json(transactions);

  } catch (error) {
    console.error('❌ 결제 내역 조회 실패:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: '결제 내역 조회 실패',
      details: error.message
    });
  }
});

// 환불 요청 (관리자용)
router.post('/refund', async (req, res) => {
  console.log('💸 환불 요청 처리 시작');
  
  try {
    const { imp_uid, reason } = req.body;
    
    console.log('📋 환불 요청 정보:', {
      imp_uid,
      reason,
      headers: req.headers
    });
    
    // 관리자 권한 확인 (추후 구현)
    // if (!isAdmin(req.headers['x-user-id'])) {
    //   return res.status(403).json({ error: 'Unauthorized' });
    // }

    console.log('🔑 포트원 액세스 토큰 획득 중...');
    const accessToken = await getPortoneAccessToken();
    
    // 포트원 환불 요청
    console.log('💸 포트원 환불 요청 중...');
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

    console.log('📨 환불 응답:', {
      status: refundResponse.status,
      data: refundResponse.data
    });

    if (refundResponse.data.code === 0) {
      console.log('✅ 환불 성공 - 거래 상태 업데이트 중...');
      // 환불 성공 - 트랜잭션 상태 업데이트
      const updatedTransactions = await prisma.heartTransaction.updateMany({
        where: { impUid: imp_uid },
        data: { 
          status: 'refunded',
          refundedAt: new Date()
        }
      });

      console.log('✅ 환불 처리 완료:', {
        imp_uid,
        updatedCount: updatedTransactions.count
      });

      res.json({
        success: true,
        message: '환불이 완료되었습니다'
      });
    } else {
      console.error('❌ 환불 실패:', refundResponse.data);
      throw new Error(refundResponse.data.message);
    }

  } catch (error) {
    console.error('❌ 환불 처리 실패:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      response: error.response?.data,
      status: error.response?.status
    });
    res.status(500).json({ 
      error: '환불 처리 실패',
      details: error.message
    });
  }
});

console.log('✅ Payment 라우트 설정 완료');

module.exports = router; 