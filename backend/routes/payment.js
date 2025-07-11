const express = require('express');
const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const router = express.Router();
const prisma = new PrismaClient();

console.log('🔧 Payment 라우트 초기화');

// 포트원 설정 - 환경변수 우선 사용
const PORTONE_API_URL = process.env.PORTONE_API_URL || 'https://api.iamport.kr';
const IMP_KEY = process.env.IMP_KEY || 'imp20122888'; // 실제 가맹점 식별코드
const IMP_SECRET = process.env.IMP_SECRET; // 환경변수에서만 가져오기
const CHANNEL_KEY = process.env.CHANNEL_KEY || 'channel-key-720d69be-767a-420c-91c8-2855ca00192d'; // 실제 채널키
const PG_PROVIDER = process.env.PG_PROVIDER || 'html5_inicis'; // KG이니시스 모바일웹
const MERCHANT_ID = process.env.MERCHANT_ID || 'MOIplay998'; // 실제 상점아이디

console.log('📋 포트원 설정 정보:', {
  PORTONE_API_URL,
  IMP_KEY: IMP_KEY,
  IMP_SECRET: IMP_SECRET ? '설정됨' : '미설정',
  CHANNEL_KEY: CHANNEL_KEY,
  PG_PROVIDER: PG_PROVIDER,
  MERCHANT_ID: MERCHANT_ID
});

console.log('⚠️ 주의: 실제 포트원 연동을 위해서는 다음이 필요합니다:');
console.log('1. 포트원 콘솔에서 API Secret 확인 필요');
console.log('2. 환경변수 IMP_SECRET 설정 필요');
console.log('3. 포트원 콘솔에서 PG 설정 완료 확인 필요');

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
    
    // 🔥 임시 테스트 모드 활성화
    console.log('⚠️ 포트원 API 연결 실패로 인한 임시 테스트 모드 활성화');
    console.log('🧪 테스트 환경에서는 웹훅 기반 처리를 우선 사용합니다');
    
    throw new Error('포트원 API 연결 실패 - 테스트 모드 활성화');
  }
}

// 결제 검증
router.post('/verify', async (req, res) => {
  console.log('🔍 ===== 결제 검증 시작 (웹훅 우선 모드) =====');
  console.log('📋 요청 정보:', {
    timestamp: new Date().toISOString(),
    body: req.body,
    headers: {
      'x-user-id': req.headers['x-user-id'],
      'x-user-email': req.headers['x-user-email'],
      'origin': req.headers.origin,
      'user-agent': req.headers['user-agent']
    }
  });

  try {
    const { imp_uid, merchant_uid } = req.body;
    const userId = req.headers['x-user-id'];
    const userEmail = req.headers['x-user-email'];

    console.log('📝 검증 파라미터:', {
      imp_uid,
      merchant_uid,
      userId,
      userEmail
    });

    // 1단계: 필수 파라미터 검증
    if (!imp_uid || !merchant_uid) {
      console.error('❌ 1단계 실패: 필수 파라미터 누락');
      return res.status(400).json({ 
        success: false, 
        error: '필수 파라미터 누락',
        details: { imp_uid: !!imp_uid, merchant_uid: !!merchant_uid }
      });
    }
    console.log('✅ 1단계 성공: 필수 파라미터 검증 완료');

    // 2단계: 사용자 정보 검증
    if (!userId) {
      console.error('❌ 2단계 실패: 사용자 ID 누락');
      return res.status(400).json({ 
        success: false, 
        error: '사용자 정보 누락' 
      });
    }
    console.log('✅ 2단계 성공: 사용자 정보 검증 완료');

    // 3단계: 웹훅으로 처리된 거래 확인 (최우선)
    console.log('🎣 3단계: 웹훅 처리된 거래 확인 중...');
    const webhookTransaction = await prisma.heartTransaction.findFirst({
      where: { 
        OR: [
          { impUid: imp_uid },
          { merchantUid: merchant_uid }
        ],
        status: 'completed'
      }
    });
    
    if (webhookTransaction) {
      console.log('✅ 웹훅으로 이미 처리된 거래 발견:', {
        transactionId: webhookTransaction.id,
        hearts: webhookTransaction.heartAmount,
        amount: webhookTransaction.amount,
        userId: webhookTransaction.userId,
        impUid: webhookTransaction.impUid,
        merchantUid: webhookTransaction.merchantUid
      });
      
      // 사용자 최신 하트 잔액 조회
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { hearts: true }
      });
      
      return res.json({
        success: true,
        message: '결제 검증 완료 (웹훅 처리)',
        verification: {
          success: true,
          newBalance: user?.hearts || 0,
          hearts_added: webhookTransaction.heartAmount,
          transaction_id: webhookTransaction.id,
          imp_uid: imp_uid,
          merchant_uid: merchant_uid,
          amount: webhookTransaction.amount,
          paid_at: webhookTransaction.paidAt,
          processed_by: 'webhook'
        }
      });
    }
    
    console.log('⚠️ 웹훅 처리된 거래 없음 - 테스트 모드 또는 실시간 처리 필요');

    // 4단계: 테스트 결제 처리 (imp_uid가 test_로 시작하는 경우)
    if (imp_uid.startsWith('test_')) {
      console.log('🧪 테스트 결제 모드 활성화');
      
      // 테스트 결제 정보 생성
      const testAmount = 1000; // 기본 테스트 금액
      const testHearts = 50; // 기본 테스트 하트
      
      // 사용자 정보 조회 또는 생성
      let user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        console.log('👤 테스트 사용자 생성 중...');
        user = await prisma.user.create({
          data: {
            id: userId,
            email: userEmail || `${userId}@test.user`,
            username: userEmail?.split('@')[0] || '테스트사용자',
            hearts: 150
          }
        });
      }

      // 테스트 거래 생성 및 하트 지급
      const result = await prisma.$transaction(async (tx) => {
        // 하트 거래 기록 생성
        const heartTransaction = await tx.heartTransaction.create({
          data: {
            userId: userId,
            amount: testAmount,
            heartAmount: testHearts,
            impUid: imp_uid,
            merchantUid: merchant_uid,
            status: 'completed',
            type: 'purchase',
            paymentMethod: 'test',
            paidAt: new Date()
          }
        });

        // 사용자 하트 업데이트
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { 
            hearts: {
              increment: testHearts
            }
          }
        });

        return {
          transaction: heartTransaction,
          newBalance: updatedUser.hearts,
          hearts_added: testHearts
        };
      });

      console.log('✅ 테스트 결제 처리 완료:', {
        transactionId: result.transaction.id,
        newBalance: result.newBalance,
        hearts_added: result.hearts_added
      });

      return res.json({
        success: true,
        message: '테스트 결제 검증 완료',
        verification: {
          success: true,
          newBalance: result.newBalance,
          hearts_added: result.hearts_added,
          transaction_id: result.transaction.id,
          imp_uid: imp_uid,
          merchant_uid: merchant_uid,
          amount: testAmount,
          paid_at: new Date().toISOString(),
          processed_by: 'test_mode'
        }
      });
    }

    // 5단계: 실제 포트원 API 검증 (테스트가 아닌 경우)
    console.log('💳 실제 포트원 API 검증 시도 중...');
    
    try {
      // 포트원 액세스 토큰 획득 시도
      const accessToken = await getPortoneAccessToken();
      
      // 포트원 결제 정보 조회
      const paymentResponse = await axios.get(
        `${PORTONE_API_URL}/payments/${imp_uid}`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        }
      );

      const paymentData = paymentResponse.data;
      
      // 결제 상태 및 정보 검증
      if (paymentData.status !== 'paid') {
        return res.status(400).json({ 
          success: false, 
          error: '결제가 완료되지 않았습니다',
          status: paymentData.status
        });
      }

      if (paymentData.merchant_uid !== merchant_uid) {
        return res.status(400).json({ 
          success: false, 
          error: 'merchant_uid 불일치',
          expected: merchant_uid,
          received: paymentData.merchant_uid
        });
      }

      // 하트 패키지 정보 결정
      let heartPackage;
      const amount = paymentData.amount;
      
      if (amount === 1000) {
        heartPackage = { heartAmount: 50, price: 1000 };
      } else if (amount === 5000) {
        heartPackage = { heartAmount: 250, price: 5000 };
      } else if (amount === 10000) {
        heartPackage = { heartAmount: 500, price: 10000 };
      } else {
        heartPackage = { heartAmount: Math.floor(amount / 20), price: amount };
      }

      // 사용자 정보 조회
      let user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: userEmail || `${userId}@firebase.user`,
            username: userEmail?.split('@')[0] || '사용자',
            hearts: 150
          }
        });
      }

      // 거래 생성 및 하트 지급
      const result = await prisma.$transaction(async (tx) => {
        const heartTransaction = await tx.heartTransaction.create({
          data: {
            userId: userId,
            amount: paymentData.amount,
            heartAmount: heartPackage.heartAmount,
            impUid: imp_uid,
            merchantUid: merchant_uid,
            status: 'completed',
            type: 'purchase',
            paymentMethod: paymentData.pay_method || 'card',
            paidAt: new Date(paymentData.paid_at)
          }
        });

        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: { 
            hearts: {
              increment: heartPackage.heartAmount
            }
          }
        });

        return {
          transaction: heartTransaction,
          newBalance: updatedUser.hearts,
          hearts_added: heartPackage.heartAmount
        };
      });

      console.log('✅ 포트원 API 검증 및 처리 완료');
      return res.json({
        success: true,
        message: '결제 검증 및 하트 지급 완료',
        verification: {
          success: true,
          newBalance: result.newBalance,
          hearts_added: result.hearts_added,
          transaction_id: result.transaction.id,
          imp_uid: imp_uid,
          merchant_uid: merchant_uid,
          amount: paymentData.amount,
          paid_at: paymentData.paid_at,
          processed_by: 'portone_api'
        }
      });

    } catch (portoneError) {
      console.error('❌ 포트원 API 검증 실패:', portoneError.message);
      
      // 포트원 API 실패 시 웹훅 처리 대기 안내
      return res.json({
        success: false,
        error: '결제 검증 진행 중',
        message: '포트원 웹훅 처리를 기다리는 중입니다. 잠시 후 다시 시도해주세요.',
        details: '웹훅을 통한 자동 처리가 진행 중입니다.',
        retry_after: 3000
      });
    }

  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      success: false, 
      error: '결제 검증 중 오류가 발생했습니다',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 네이티브 인앱결제 검증 API
router.post('/verify-native', async (req, res) => {
  console.log('📱 ===== 네이티브 인앱결제 검증 시작 =====');
  console.log('📋 요청 정보:', {
    timestamp: new Date().toISOString(),
    body: req.body,
    headers: {
      'x-user-id': req.headers['x-user-id'],
      'x-user-email': req.headers['x-user-email'],
      'origin': req.headers.origin,
      'user-agent': req.headers['user-agent']
    }
  });

  try {
    const { 
      productId, 
      transactionId, 
      purchaseToken, 
      receipt, 
      platform, 
      purchaseState, 
      transactionDate, 
      heartAmount, 
      amount 
    } = req.body;
    
    const userId = req.headers['x-user-id'];
    const userEmail = req.headers['x-user-email'];
    
    console.log('📝 검증 파라미터:', {
      productId,
      transactionId,
      purchaseToken: purchaseToken ? '존재함' : '없음',
      receipt: receipt ? '존재함' : '없음',
      platform,
      purchaseState,
      transactionDate,
      heartAmount,
      amount,
      userId,
      userEmail
    });

    // 1단계: 필수 파라미터 검증
    if (!productId || !transactionId || !userId) {
      console.error('❌ 1단계 실패: 필수 파라미터 누락');
      return res.status(400).json({ 
        success: false, 
        error: '필수 파라미터 누락',
        details: { productId: !!productId, transactionId: !!transactionId, userId: !!userId }
      });
    }
    console.log('✅ 1단계 성공: 필수 파라미터 검증 완료');

    // 2단계: 중복 거래 확인
    console.log('🔍 2단계: 중복 거래 확인 중...');
    const existingTransaction = await prisma.heartTransaction.findFirst({
      where: {
        OR: [
          { nativeTransactionId: transactionId },
          { nativeProductId: productId, userId: userId, status: 'completed' }
        ]
      }
    });
    
    if (existingTransaction) {
      console.log('⚠️ 중복 거래 발견:', {
        transactionId: existingTransaction.id,
        nativeTransactionId: existingTransaction.nativeTransactionId,
        status: existingTransaction.status
      });
      
      // 이미 완료된 거래인 경우 성공 응답
      if (existingTransaction.status === 'completed') {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { hearts: true }
        });
        
        return res.json({
          success: true,
          message: '이미 처리된 거래입니다',
          hearts_added: existingTransaction.heartAmount,
          newBalance: user?.hearts || 0,
          transaction_id: existingTransaction.id,
          processed_by: 'duplicate_check'
        });
      }
    }
    console.log('✅ 2단계 성공: 중복 거래 확인 완료');

    // 3단계: 사용자 정보 조회 또는 생성
    console.log('👤 3단계: 사용자 정보 처리 중...');
    let user;
    
    try {
      user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        console.log('👤 사용자 자동 생성 중...', { userId, userEmail });
        
        const safeEmail = userEmail || `${userId}@native.mingling`;
        const safeUsername = userEmail?.split('@')[0] || `user_${userId.substring(0, 8)}`;
        
        user = await prisma.user.upsert({
          where: { id: userId },
          update: {},
          create: {
            id: userId,
            email: safeEmail,
            username: safeUsername,
            hearts: 150
          }
        });
        
        console.log('✅ 사용자 자동 생성 완료:', { id: user.id, hearts: user.hearts });
      } else {
        console.log('✅ 기존 사용자 발견:', { userId, hearts: user.hearts });
      }
    } catch (createError) {
      console.error('❌ 사용자 처리 실패:', createError);
      throw new Error('사용자 정보 처리 실패');
    }

    // 4단계: 하트 충전 및 거래 기록 생성
    console.log('🔄 4단계: 하트 충전 트랜잭션 시작...');
    const result = await prisma.$transaction(async (tx) => {
      // 하트 충전
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          hearts: {
            increment: heartAmount
          }
        }
      });

      // 거래 기록 생성
      const heartTransaction = await tx.heartTransaction.create({
        data: {
          userId: userId,
          amount: amount,
          heartAmount: heartAmount,
          status: 'completed',
          type: 'native_purchase',
          paymentMethod: platform === 'android' ? 'google_play' : 'app_store',
          paidAt: new Date(transactionDate || new Date()),
          nativeTransactionId: transactionId,
          nativeProductId: productId,
          nativePurchaseToken: purchaseToken,
          nativeReceipt: receipt,
          nativePlatform: platform,
          nativePurchaseState: purchaseState?.toString()
        }
      });

      return {
        transaction: heartTransaction,
        previousBalance: user.hearts,
        newBalance: updatedUser.hearts,
        hearts_added: heartAmount
      };
    });

    console.log('✅ 네이티브 인앱결제 처리 완료:', {
      transactionId: result.transaction.id,
      nativeTransactionId: transactionId,
      productId: productId,
      hearts: result.hearts_added,
      previousBalance: result.previousBalance,
      newBalance: result.newBalance,
      platform: platform
    });

    return res.json({
      success: true,
      message: '네이티브 인앱결제 검증 및 하트 충전 완료',
      hearts_added: result.hearts_added,
      newBalance: result.newBalance,
      previousBalance: result.previousBalance,
      transaction_id: result.transaction.id,
      native_transaction_id: transactionId,
      product_id: productId,
      platform: platform,
      processed_by: 'native_iap'
    });

  } catch (error) {
    console.error('❌ 네이티브 인앱결제 검증 실패:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return res.status(500).json({ 
      success: false, 
      error: '네이티브 인앱결제 검증 중 오류가 발생했습니다',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 하트 충전 처리 (성공 코드 방식)
router.post('/charge-hearts', async (req, res) => {
  console.log('💖 하트 충전 처리 시작 (KG이니시스 방식)');
  
  try {
    const { 
      imp_uid, 
      merchant_uid, 
      package_id, 
      heart_amount, 
      paid_amount 
    } = req.body;
    
    const userId = req.headers['x-user-id'];
    const userEmail = req.headers['x-user-email'];
    
    console.log('📋 하트 충전 요청 정보:', {
      imp_uid,
      merchant_uid,
      package_id,
      heart_amount,
      paid_amount,
      userId,
      userEmail,
      headers: req.headers
    });
    
    if (!userId) {
      console.error('❌ 사용자 ID 없음');
      return res.status(401).json({ 
        success: false, 
        error: 'User ID required' 
      });
    }

    console.log('💖 하트 충전 처리:', {
      userId: userId,
      packageId: package_id,
      heartAmount: heart_amount,
      paidAmount: paid_amount
    });

    // 사용자 정보 조회 또는 생성 (upsert 패턴)
    console.log('👤 사용자 정보 조회 및 자동 생성 중...');
    let user;
    
    try {
      // 먼저 사용자 ID로 조회
      user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        console.log('👤 사용자 자동 생성 중...', { userId, userEmail });
        
        // 사용자 생성 시 이메일 중복 방지
        const safeEmail = userEmail || `${userId}@auto.mingling`;
        const safeUsername = userEmail?.split('@')[0] || `user_${userId.substring(0, 8)}`;
        
        // upsert 패턴으로 안전하게 생성
        user = await prisma.user.upsert({
          where: { id: userId },
          update: {
            // 이미 존재하면 업데이트하지 않음
          },
          create: {
            id: userId,
            email: safeEmail,
            username: safeUsername,
            hearts: 150 // 기본 하트
          }
        });
        
        console.log('✅ 사용자 자동 생성 완료:', user);
      } else {
        console.log('✅ 기존 사용자 발견:', { userId, hearts: user.hearts });
      }
    } catch (createError) {
      console.error('❌ 사용자 처리 실패:', createError);
      
      // 최후의 수단: 사용자 ID로 다시 조회
      user = await prisma.user.findUnique({
        where: { id: userId }
      });
      
      if (!user) {
        throw new Error('사용자 생성에 실패했습니다');
      }
    }

    // 트랜잭션으로 하트 충전 및 거래 기록 생성
    console.log('🔄 하트 충전 트랜잭션 시작...');
    const result = await prisma.$transaction(async (tx) => {
      // 1. 하트 충전
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          hearts: {
            increment: heart_amount
          }
        }
      });

      // 2. 거래 기록 생성
      const heartTransaction = await tx.heartTransaction.create({
        data: {
          userId: userId,
          amount: paid_amount,
          heartAmount: heart_amount,
          impUid: imp_uid,
          merchantUid: merchant_uid,
          status: 'completed',
          type: 'purchase',
          paymentMethod: 'card',
          paidAt: new Date(),
          completedAt: new Date()
        }
      });

      return {
        user: updatedUser,
        transaction: heartTransaction
      };
    });

    console.log('✅ 하트 충전 완료:', {
      userId: userId,
      addedHearts: heart_amount,
      newBalance: result.user.hearts,
      transactionId: result.transaction.id
    });

    res.json({
      success: true,
      addedHearts: heart_amount,
      newBalance: result.user.hearts,
      transaction: {
        id: result.transaction.id,
        impUid: imp_uid,
        merchantUid: merchant_uid,
        amount: paid_amount
      }
    });

  } catch (error) {
    console.error('❌ 하트 충전 처리 실패:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      success: false,
      error: '하트 충전 중 오류가 발생했습니다',
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

// 포트원 웹훅 엔드포인트 - 결제 완료 시 자동 처리
router.post('/webhook', async (req, res) => {
  console.log('🎣 포트원 웹훅 수신:', {
    timestamp: new Date().toISOString(),
    body: req.body,
    headers: req.headers
  });
  
  try {
    const { imp_uid, merchant_uid, status } = req.body;
    
    if (!imp_uid || !merchant_uid) {
      console.error('❌ 웹훅 데이터 누락:', { imp_uid, merchant_uid, status });
      return res.status(400).json({ error: '필수 데이터 누락' });
    }

    console.log('🔍 웹훅 결제 정보:', { imp_uid, merchant_uid, status });

    // 결제 완료 상태인 경우에만 처리
    if (status === 'paid') {
      console.log('💳 결제 완료 웹훅 처리 시작');
      
      // 이미 처리된 결제인지 확인
      const existingTransaction = await prisma.heartTransaction.findFirst({
        where: { impUid: imp_uid }
      });

      if (existingTransaction) {
        console.log('ℹ️ 이미 처리된 결제:', existingTransaction);
        return res.json({ success: true, message: '이미 처리된 결제' });
      }

      // merchant_uid에서 사용자 정보 추출 (merchant_uid 형식: hearts_{userId}_{timestamp})
      let userId = null;
      let heartAmount = 50; // 기본값
      let paymentAmount = 1000; // 기본값
      
      try {
        // merchant_uid 파싱 시도
        const parts = merchant_uid.split('_');
        if (parts.length >= 3 && parts[0] === 'hearts') {
          userId = parts[1];
          
          // 테스트 결제의 경우 기본값 사용
          if (imp_uid.startsWith('test_')) {
            heartAmount = 50;
            paymentAmount = 1000;
          } else {
            // 실제 결제인 경우 포트원 API에서 결제 정보 조회
            console.log('🔑 포트원 액세스 토큰 획득 중...');
            const accessToken = await getPortoneAccessToken();
            
            console.log('🌐 포트원 결제 정보 조회 중...');
            const paymentResponse = await axios.get(`${PORTONE_API_URL}/payments/${imp_uid}`, {
              headers: {
                'Authorization': `Bearer ${accessToken}`
              }
            });

            const paymentData = paymentResponse.data.response;
            
            if (!paymentData) {
              console.error('❌ 결제 정보 없음:', paymentResponse.data);
              return res.status(404).json({ error: '결제 정보를 찾을 수 없습니다' });
            }

            console.log('📋 웹훅 결제 데이터:', {
              status: paymentData.status,
              amount: paymentData.amount,
              merchant_uid: paymentData.merchant_uid,
              pay_method: paymentData.pay_method,
              paid_at: paymentData.paid_at
            });

            paymentAmount = paymentData.amount;
            
            // 결제 금액에 따른 하트 수량 결정
            switch (paymentData.amount) {
              case 1000:
                heartAmount = 50;
                break;
              case 2000:
                heartAmount = 100;
                break;
              case 5000:
                heartAmount = 300;
                break;
              case 10000:
                heartAmount = 700;
                break;
              default:
                heartAmount = Math.floor(paymentData.amount / 20); // 1원당 0.05하트
            }
          }
        }
      } catch (parseError) {
        console.error('❌ merchant_uid 파싱 실패:', parseError);
      }

      if (!userId) {
        console.error('❌ 사용자 ID 추출 실패:', { merchant_uid });
        // 사용자 ID를 추출할 수 없는 경우, 결제 정보만 저장하고 나중에 수동 처리
        await prisma.heartTransaction.create({
          data: {
            userId: 'unknown',
            impUid: imp_uid,
            merchantUid: merchant_uid,
            amount: paymentAmount,
            type: 'purchase',
            status: 'pending_user_verification',
            paymentMethod: 'card',
            paidAt: new Date()
          }
        });
        
        return res.json({ 
          success: true, 
          message: '결제 정보 저장됨 - 사용자 확인 필요' 
        });
      }

      console.log('👤 웹훅 사용자 정보:', { userId, heartAmount, paymentAmount });

      // 사용자 정보 조회 또는 생성
      let user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        console.log('👤 웹훅에서 사용자 자동 생성 중...');
        user = await prisma.user.create({
          data: {
            id: userId,
            email: `${userId}@webhook.user`,
            username: `user_${userId}`,
            hearts: heartAmount
          }
        });
        console.log('✅ 웹훅 사용자 생성 완료:', user);
      } else {
        console.log('👤 웹훅 기존 사용자 하트 추가 중...');
        console.log('📊 현재 하트:', user.hearts);
        user = await prisma.user.update({
          where: { id: userId },
          data: {
            hearts: {
              increment: heartAmount
            }
          }
        });
        console.log('✅ 웹훅 하트 추가 완료 - 새 잔액:', user.hearts);
      }

      // 거래 정보 저장
      const transaction = await prisma.heartTransaction.create({
        data: {
          userId: userId,
          impUid: imp_uid,
          merchantUid: merchant_uid,
          amount: paymentAmount,
          type: 'purchase',
          status: 'completed',
          heartAmount: heartAmount,
          paymentMethod: 'card',
          paidAt: new Date(),
          completedAt: new Date()
        }
      });

      console.log('✅ 웹훅 결제 처리 완료:', {
        userId: userId,
        addedHearts: heartAmount,
        newBalance: user.hearts,
        transactionId: transaction.id,
        imp_uid: imp_uid
      });

      res.json({
        success: true,
        message: '결제 처리 완료',
        data: {
          userId: userId,
          addedHearts: heartAmount,
          newBalance: user.hearts
        }
      });

    } else {
      console.log('ℹ️ 결제 완료가 아닌 웹훅:', { status });
      res.json({ success: true, message: `상태 확인: ${status}` });
    }

  } catch (error) {
    console.error('❌ 웹훅 처리 실패:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      response: error.response?.data,
      status: error.response?.status
    });
    
    // 웹훅 실패 시에도 200 응답을 보내야 포트원에서 재시도하지 않음
    res.status(200).json({ 
      success: false,
      error: '웹훅 처리 실패',
      details: error.message
    });
  }
});

console.log('✅ Payment 라우트 설정 완료');

module.exports = router; 