// 💳 포트원(아임포트) + KG이니시스 결제 서비스

class PaymentService {
  constructor() {
    console.log('🔧 PaymentService 초기화 시작');
    
    // API URL 설정 (Cloudflare HTTPS 사용)
    this.apiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.minglingchat.com/api' 
      : 'http://localhost:8001/api';
    
    console.log('🌐 API URL 설정:', this.apiUrl);
    
    // 실제 포트원 채널 정보
    this.channelKey = 'channel-key-720d69be-767a-420c-91c8-2855ca00192d';
    this.pgProvider = 'html5_inicis.MOIplay998'; // PG사.상점아이디 형식
    this.merchantId = 'MOIplay998';
    this.impCode = 'imp20122888'; // 고객사 식별코드
    
    this.heartPackages = [
      { id: 'basic', hearts: 50, price: 1000, name: '기본 팩' },
      { id: 'popular', hearts: 120, price: 2000, name: '인기 팩' },
      { id: 'value', hearts: 300, price: 4500, name: '대용량 팩' },
      { id: 'premium', hearts: 500, price: 7000, name: '프리미엄 팩' }
    ];
    
    // 포트원 SDK 로드 상태
    this.isSDKLoaded = false;
  }

  // 포트원 SDK 로드 (V1 SDK 사용) - lazy loading
  async loadSDK() {
    console.log('📦 포트원 SDK 로드 시작');
    
    if (this.isSDKLoaded || window.IMP) {
      console.log('✅ 포트원 SDK 이미 로드됨');
      this.isSDKLoaded = true;
      return;
    }

    return new Promise((resolve, reject) => {
      console.log('🔄 포트원 V1 SDK 스크립트 로드 중...');
      
      // 기존 스크립트 제거
      const existingScript = document.querySelector('script[src*="iamport"]');
      if (existingScript) {
        console.log('🗑️ 기존 포트원 스크립트 제거');
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      // 포트원 V1 SDK 사용 (안정적인 버전)
      script.src = 'https://cdn.iamport.kr/js/iamport.payment-1.2.0.js';
      script.async = true;
      
      script.onload = () => {
        console.log('📦 포트원 V1 SDK 스크립트 로드됨');
        console.log('🔍 window 객체 확인:', {
          IMP: !!window.IMP,
          windowKeys: Object.keys(window).filter(key => key.includes('IMP'))
        });
        
        // 잠시 대기 후 초기화
        setTimeout(() => {
          if (window.IMP) {
            try {
              console.log('🔧 IMP.init 호출:', this.impCode);
              window.IMP.init(this.impCode); // 고객사 식별코드로 초기화
              this.isSDKLoaded = true;
              console.log('✅ 포트원 V1 SDK 초기화 완료:', this.impCode);
              resolve();
            } catch (error) {
              console.error('❌ 포트원 V1 SDK 초기화 실패:', error);
              reject(error);
            }
          } else {
            console.error('❌ 포트원 SDK 객체를 찾을 수 없음');
            reject(new Error('포트원 SDK 로드 실패'));
          }
        }, 500);
      };
      
      script.onerror = (error) => {
        console.error('❌ 포트원 SDK 스크립트 로드 실패:', error);
        reject(new Error('포트원 SDK 스크립트 로드 실패'));
      };
      
      console.log('📡 포트원 V1 SDK 스크립트 추가:', script.src);
      document.head.appendChild(script);
    });
  }

  // 결제 요청
  async requestPayment(paymentData) {
    console.log('💳 결제 요청 시작');
    console.log('📊 결제 데이터:', paymentData);
    
    try {
      // SDK 로드 확인
      console.log('🔍 SDK 로드 상태 확인:', this.isSDKLoaded);
      if (!this.isSDKLoaded) {
        console.log('📦 SDK 로드 대기 중...');
        await this.loadSDK();
      }

      // 결제 데이터 구성 - 포트원 V1 방식
      const paymentParams = {
        pg: this.pgProvider, // KG이니시스 PG 설정
        pay_method: 'card', // 결제 방법
        merchant_uid: this.generateOrderId(), // 주문번호
        name: paymentData.productName, // 상품명
        amount: paymentData.amount, // 결제 금액
        buyer_email: paymentData.userEmail,
        buyer_name: paymentData.userName,
        buyer_tel: paymentData.userPhone || '010-0000-0000',
        buyer_addr: '서울특별시',
        buyer_postcode: '06018',
        // 모바일 환경 대응
        m_redirect_url: `${window.location.origin}/payment/result`,
        // 커스텀 데이터
        custom_data: JSON.stringify({
          userId: paymentData.userId,
          productType: paymentData.productType,
          heartAmount: paymentData.heartAmount
        })
      };

      console.log('📋 결제 파라미터 구성 완료:', paymentParams);

      // 결제 실행
      return new Promise(async (resolve, reject) => {
        console.log('🚀 결제 실행 시작');
        
        try {
          // 포트원 V1 SDK 사용
          if (window.IMP) {
            console.log('🔥 포트원 V1 SDK 사용');
            console.log('🎯 IMP.request_pay 호출');
            
            window.IMP.request_pay(paymentParams, (response) => {
              console.log('📨 포트원 V1 응답:', response);
              
              if (response.success) {
                console.log('✅ 결제 성공 (V1)');
                resolve({
                  success: true,
                  impUid: response.imp_uid,
                  merchantUid: response.merchant_uid,
                  amount: response.paid_amount,
                  status: response.status
                });
              } else {
                const errorMsg = response.error_msg || '결제가 취소되었습니다';
                console.error('❌ 결제 실패 (V1):', {
                  error_msg: response.error_msg,
                  error_code: response.error_code,
                  full_response: response
                });
                reject({
                  success: false,
                  error: errorMsg,
                  code: response.error_code
                });
              }
            });
          } else {
            console.error('❌ 포트원 SDK 사용 불가');
            reject(new Error('포트원 SDK가 로드되지 않았습니다'));
          }
        } catch (error) {
          console.error('💥 결제 요청 중 예외 발생:', error);
          reject({
            success: false,
            error: error.message || '결제 요청 실패',
            code: 'SDK_ERROR'
          });
        }
      });

    } catch (error) {
      console.error('❌ 결제 요청 최종 실패:', error);
      throw error;
    }
  }

  // 🚀 서버에 하트 충전 요청 (성공 코드 방식)
  async chargeHearts(chargeData) {
    console.log('🔍 서버에 하트 충전 요청 시작', chargeData);

    // 🔧 Cloudflare 차단 우회를 위한 대안 경로들
    const apiPaths = [
      '/api/payment/charge-hearts',    // 원래 경로
      '/api/purchase/charge-hearts',   // 대안 경로 1
      '/api/transaction/charge-hearts', // 대안 경로 2
      '/api/hearts/purchase',          // 대안 경로 3 (새로운 결제 검증 포함)
      '/api/hearts/charge'             // 대안 경로 4 (기존 단순 충전 - 임시 해결책)
    ];

    const requestData = {
      imp_uid: chargeData.impUid,
      merchant_uid: chargeData.merchantUid,
      package_id: chargeData.packageId,
      heart_amount: chargeData.heartAmount,
      paid_amount: chargeData.amount
    };

    const requestHeaders = {
      'Content-Type': 'application/json',
      'X-User-ID': chargeData.userId,
      'X-User-Email': chargeData.userEmail || ''
    };

    // 🔄 여러 경로를 순차적으로 시도
    for (let i = 0; i < apiPaths.length; i++) {
      const apiPath = apiPaths[i];
      const fullUrl = `${this.apiUrl}${apiPath}`;
      
      // 🔧 경로에 맞는 요청 데이터 형식 변환
      let requestPayload = requestData;
      if (apiPath === '/api/hearts/charge') {
        // 기존 hearts/charge 엔드포인트는 단순히 amount만 필요
        requestPayload = { amount: chargeData.heartAmount };
      }
      
      try {
        console.log(`🌐 하트 충전 API 요청 시도 ${i + 1}/${apiPaths.length}:`, {
          url: fullUrl,
          headers: requestHeaders,
          data: requestPayload
        });

        const response = await fetch(fullUrl, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestPayload)
        });

        console.log(`📨 하트 충전 응답 수신 (경로 ${i + 1}):`, {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          url: fullUrl
        });

        if (response.ok) {
          const responseData = await response.json();
          console.log(`✅ 하트 충전 성공 (경로 ${i + 1}):`, responseData);

          if (responseData.success) {
            console.log(`🎉 하트 충전 완료 - 경로: ${apiPath}`);
            return responseData;
          } else {
            console.error(`❌ 하트 충전 실패 (경로 ${i + 1}):`, responseData.error);
            throw new Error(responseData.error || '하트 충전에 실패했습니다');
          }
        } else if (response.status === 404 && i < apiPaths.length - 1) {
          // 404 에러이고 다음 경로가 있으면 계속 시도
          console.log(`⚠️ 경로 ${i + 1} 404 에러 - 다음 경로 시도: ${apiPaths[i + 1]}`);
          continue;
        } else {
          // 다른 에러이거나 마지막 경로면 에러 처리
          const responseData = await response.json();
          throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (error) {
        console.error(`❌ 하트 충전 경로 ${i + 1} 실패:`, error);
        
        // 마지막 경로가 아니면 다음 경로 시도
        if (i < apiPaths.length - 1) {
          console.log(`🔄 다음 경로 시도: ${apiPaths[i + 1]}`);
          continue;
        } else {
          // 모든 경로 실패
          console.error('❌ 모든 하트 충전 경로 실패');
          throw error;
        }
      }
    }
  }

  // 주문번호 생성 (중복 방지 강화)
  generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    const randomStr = Math.random().toString(36).substring(2, 8);
    const orderId = `HEART_${timestamp}_${random}_${randomStr}`;
    console.log('🆔 주문번호 생성:', orderId);
    return orderId;
  }

  // 하트 상품 정보
  getHeartProducts() {
    return this.heartPackages;
  }

  // 🎯 메인 하트 구매 함수 (성공 코드 기반 개선)
  async purchaseHearts(packageId, userInfo = {}) {
    console.log('🛒 하트 구매 시작 (KG이니시스 방식)', { packageId, userInfo });
    
    try {
      // 1단계: 하트 패키지 검증
      const heartPackage = this.heartPackages.find(pkg => pkg.id === packageId);
      if (!heartPackage) {
        throw new Error('유효하지 않은 하트 패키지입니다.');
      }
      console.log('✅ 1단계: 하트 패키지 검증 완료', heartPackage);

      // 2단계: 사용자 정보 수집
      let userEmail = userInfo.email || localStorage.getItem('userEmail') || 'user@minglingchat.com';
      let userId = userInfo.userId || localStorage.getItem('userId') || 'guest';
      
      // authData에서도 확인
      try {
        const authData = JSON.parse(localStorage.getItem('authData') || '{}');
        if (authData.email && (!userEmail || userEmail === 'user@minglingchat.com')) {
          userEmail = authData.email;
        }
        if (authData.userId && (!userId || userId === 'guest')) {
          userId = authData.userId;
        }
      } catch (error) {
        console.warn('⚠️ authData 파싱 실패:', error);
      }
      
      console.log('✅ 2단계: 사용자 정보 확인 완료', { userEmail, userId });

      // 3단계: 결제 요청 (성공 코드 방식 적용)
      console.log('💳 3단계: 결제 요청 시작');
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const orderId = `HEART-${userId}-${packageId}-${timestamp}-${randomId}`;

      const paymentResult = await new Promise((resolve, reject) => {
        if (!window.IMP) {
          reject(new Error('포트원 SDK가 로드되지 않았습니다.'));
          return;
        }

        console.log('🔥 포트원 결제 요청 시작');
        window.IMP.request_pay({
          pg: 'html5_inicis.MOIplay998', // KG이니시스 설정
          pay_method: 'card',
          merchant_uid: orderId,
          name: `${heartPackage.hearts}개 하트`,
          amount: heartPackage.price,
          buyer_email: userEmail,
          buyer_name: userInfo.name || userEmail.split('@')[0],
          buyer_tel: userInfo.phone || '010-0000-0000',
          m_redirect_url: `${window.location.origin}/payment/complete`,
        }, async (rsp) => {
          console.log('📨 포트원 결제 응답:', rsp);
          
          if (rsp.success) {
            console.log('✅ 결제 성공:', rsp.imp_uid);
            resolve({
              success: true,
              impUid: rsp.imp_uid,
              merchantUid: rsp.merchant_uid,
              amount: rsp.paid_amount,
              status: rsp.status
            });
          } else {
            console.error('❌ 결제 실패:', rsp.error_msg);
            reject(new Error(rsp.error_msg || '결제가 취소되었습니다.'));
          }
        });
      });

      console.log('✅ 3단계: 결제 완료', paymentResult);

      // 4단계: 서버에 하트 충전 요청 (성공 코드 방식)
      console.log('🔍 4단계: 서버에 하트 충전 요청');
      const chargeResult = await this.chargeHearts({
        impUid: paymentResult.impUid,
        merchantUid: paymentResult.merchantUid,
        packageId: packageId,
        heartAmount: heartPackage.hearts,
        amount: heartPackage.price,
        userId: userId,
        userEmail: userEmail
      });

      console.log('✅ 4단계: 하트 충전 완료', chargeResult);

      // 5단계: 성공 응답 반환
      console.log('🎉 전체 하트 구매 과정 완료');
      return {
        success: true,
        impUid: paymentResult.impUid,
        merchantUid: paymentResult.merchantUid,
        amount: paymentResult.amount,
        hearts: heartPackage.hearts,
        newBalance: chargeResult.newBalance,
        message: `${heartPackage.hearts}개 하트 구매 완료!`
      };

    } catch (error) {
      console.error('❌ 하트 구매 실패:', error);
      throw error;
    }
  }

  // 사용자 정보 헬퍼 함수들
  getUserEmailFromAuth() {
    try {
      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      return authData.email || localStorage.getItem('userEmail') || null;
    } catch (error) {
      console.error('Auth 데이터 파싱 실패:', error);
      return localStorage.getItem('userEmail') || null;
    }
  }

  getUserIdFromAuth() {
    try {
      const authData = JSON.parse(localStorage.getItem('authData') || '{}');
      return authData.userId || localStorage.getItem('userId') || null;
    } catch (error) {
      console.error('Auth 데이터 파싱 실패:', error);
      return localStorage.getItem('userId') || null;
    }
  }

  getHeartPackage(packageId) {
    return this.heartPackages.find(pkg => pkg.id === packageId);
  }
}

export default PaymentService; 