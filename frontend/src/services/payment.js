// 💳 포트원(아임포트) + KG이니시스 결제 서비스
import API_CONFIG, { API_ENDPOINTS, getDefaultHeaders } from '../config/api';

class PaymentService {
  constructor() {
    console.log('🔧 PaymentService 초기화 시작');
    
    // API 설정 사용 (중앙화된 설정)
    this.apiConfig = API_CONFIG;
    this.apiURL = API_CONFIG.apiURL;
    this.endpoints = API_ENDPOINTS;
    
    console.log('🌐 Payment API 설정:', {
      environment: this.apiConfig.environment,
      apiURL: this.apiURL,
      enableDebug: this.apiConfig.enableDebug
    });
    
    // 환경별 포트원 설정
    this.channelKey = process.env.REACT_APP_CHANNEL_KEY || 'channel-key-720d69be-767a-420c-91c8-2855ca00192d';
    this.pgProvider = process.env.REACT_APP_PG_PROVIDER || 'html5_inicis.MOIplay998'; // PG사.상점아이디 형식
    this.merchantId = process.env.REACT_APP_MERCHANT_ID || 'MOIplay998';
    this.impCode = process.env.REACT_APP_IMP_CODE || 'imp20122888'; // 고객사 식별코드
    
    this.heartPackages = [
      { id: 'basic', hearts: 50, price: 1000, name: '기본 팩' },
      { id: 'popular', hearts: 120, price: 2000, name: '인기 팩' },
      { id: 'value', hearts: 300, price: 4500, name: '대용량 팩' },
      { id: 'premium', hearts: 500, price: 7000, name: '프리미엄 팩' }
    ];
    
    // 포트원 SDK 로드 상태
    this.isSDKLoaded = false;
  }

  // 인앱결제 처리 (앱에서 결제 완료 후 서버에 전송)
  async processInAppPurchase(purchaseData) {
    console.log('📱 인앱결제 처리 시작:', purchaseData);
    
    try {
      const response = await fetch(`${this.apiURL}${this.endpoints.processInAppPurchase}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getDefaultHeaders()
        },
        body: JSON.stringify({
          transactionId: purchaseData.transactionId,
          productId: purchaseData.productId,
          amount: purchaseData.amount,
          userId: purchaseData.userId,
          userEmail: purchaseData.userEmail,
          platform: 'android',
          purchaseToken: purchaseData.purchaseToken || purchaseData.transactionId
        })
      });

      if (!response.ok) {
        throw new Error(`서버 응답 오류: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ 인앱결제 서버 처리 완료:', result);
      
      return result;
    } catch (error) {
      console.error('❌ 인앱결제 서버 처리 실패:', error);
      throw error;
    }
  }

  // 포트원 SDK 로드
  async loadSDK() {
    if (this.isSDKLoaded) {
      console.log('✅ 포트원 SDK 이미 로드됨');
      return Promise.resolve();
    }

    console.log('📦 포트원 SDK 로드 시작');
    
    return new Promise((resolve, reject) => {
      // 이미 로드된 경우
      if (window.IMP) {
        window.IMP.init(this.impCode);
        this.isSDKLoaded = true;
        console.log('✅ 포트원 SDK 로드 완료 (캐시됨)');
        resolve();
        return;
      }

      // 스크립트 태그 생성
      const script = document.createElement('script');
      script.src = 'https://cdn.iamport.kr/v1/iamport.js';
      script.onload = () => {
        if (window.IMP) {
          window.IMP.init(this.impCode);
          this.isSDKLoaded = true;
          console.log('✅ 포트원 SDK 로드 완료');
          resolve();
        } else {
          console.error('❌ 포트원 SDK 로드 실패: IMP 객체 없음');
          reject(new Error('포트원 SDK 로드 실패'));
        }
      };
      script.onerror = (error) => {
        console.error('❌ 포트원 SDK 스크립트 로드 실패:', error);
        reject(new Error('포트원 SDK 스크립트 로드 실패'));
      };

      document.head.appendChild(script);
      console.log('📡 포트원 SDK 스크립트 추가됨');
    });
  }

  // 주문 ID 생성 (고유성 강화)
  generateOrderId() {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `HEART-${timestamp}-${randomId}-${randomStr}`;
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

      // 포트원 결제 요청
      const paymentResult = await new Promise((resolve, reject) => {
        if (!window.IMP) {
          reject(new Error('포트원 SDK가 로드되지 않았습니다.'));
          return;
        }

        console.log('🔥 포트원 결제 요청 시작');
        window.IMP.request_pay(paymentParams, (response) => {
          console.log('📨 포트원 결제 응답:', response);
          
          if (response.success) {
            console.log('✅ 결제 성공:', response.imp_uid);
            resolve({
              success: true,
              impUid: response.imp_uid,
              merchantUid: response.merchant_uid,
              amount: response.paid_amount,
              status: response.status,
              payMethod: response.pay_method
            });
          } else {
            console.error('❌ 결제 실패:', response.error_msg);
            reject(new Error(response.error_msg || '결제가 취소되었습니다.'));
          }
        });
      });

      console.log('✅ 포트원 결제 완료:', paymentResult);
      return paymentResult;

    } catch (error) {
      console.error('❌ 결제 요청 실패:', error);
      throw error;
    }
  }

  // 🚀 서버에 하트 충전 요청 (다중 경로 지원)
  async chargeHearts(chargeData) {
    console.log('🔍 서버에 하트 충전 요청 시작', chargeData);

    // 🔧 대안 경로들 (API_ENDPOINTS에서 가져오기)
    const apiPaths = this.endpoints.PAYMENT.CHARGE_HEARTS;

    const requestData = {
      imp_uid: chargeData.impUid,
      merchant_uid: chargeData.merchantUid,
      package_id: chargeData.packageId,
      heart_amount: chargeData.heartAmount,
      paid_amount: chargeData.amount
    };

    const requestHeaders = {
      ...getDefaultHeaders(),
      'X-User-ID': chargeData.userId,
      'X-User-Email': chargeData.userEmail || ''
    };

    // 🔄 여러 경로를 순차적으로 시도
    for (let i = 0; i < apiPaths.length; i++) {
      const fullUrl = apiPaths[i];
      
      // 🔧 경로에 맞는 요청 데이터 형식 변환
      let requestPayload = requestData;
      if (fullUrl.includes('/hearts/charge')) {
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
            console.log(`🎉 하트 충전 완료 - 경로: ${fullUrl}`);
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

  // 하트 상품 정보
  getHeartProducts() {
    return this.heartPackages;
  }

  // 하트 구매 통합 메서드
  async purchaseHearts(packageId, userInfo = {}) {
    try {
      console.log('🛒 하트 구매 시작:', { packageId, userInfo });

      // 1단계: 사용자 정보 확인
      const userId = localStorage.getItem('userId') || userInfo.userId;
      const userEmail = localStorage.getItem('userEmail') || userInfo.email;
      
      if (!userId || !userEmail) {
        throw new Error('사용자 정보가 없습니다. 다시 로그인해주세요.');
      }

      console.log('✅ 1단계: 사용자 정보 확인 완료', { userId, userEmail });

      // 2단계: 하트 패키지 정보 확인
      const heartPackage = this.heartPackages.find(pkg => pkg.id === packageId);
      if (!heartPackage) {
        throw new Error('유효하지 않은 하트 패키지입니다.');
      }

      console.log('✅ 2단계: 하트 패키지 확인 완료', heartPackage);

      // 3단계: 결제 요청 (포트원)
      console.log('🔍 3단계: 포트원 결제 요청');
      const orderId = this.generateOrderId();

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

      // 4단계: 서버에 하트 충전 요청
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

      // 5단계: 백엔드 응답 데이터 처리 (완전한 동기식 정보)
      console.log('🔄 5단계: 백엔드 완전한 응답 데이터 처리');
      console.log('📊 백엔드 응답 상세:', chargeResult);

      // 데이터 검증
      if (!chargeResult.hearts || !chargeResult.payment || !chargeResult.transaction) {
        throw new Error('백엔드에서 불완전한 응답을 받았습니다.');
      }

      // 하트 수량 검증 (계산값과 실제값 비교)
      const expectedBalance = chargeResult.hearts.previousBalance + chargeResult.hearts.addedHearts;
      const actualBalance = chargeResult.hearts.newBalance;
      
      if (expectedBalance !== actualBalance) {
        console.warn('⚠️ 하트 수량 계산 불일치:', {
          예상값: expectedBalance,
          실제값: actualBalance,
          이전하트: chargeResult.hearts.previousBalance,
          추가하트: chargeResult.hearts.addedHearts
        });
      } else {
        console.log('✅ 하트 수량 계산 검증 완료:', {
          이전하트: chargeResult.hearts.previousBalance,
          추가하트: chargeResult.hearts.addedHearts,
          새로운하트: chargeResult.hearts.newBalance
        });
      }

      // 6단계: 성공 응답 반환 (완전한 동기식 정보)
      console.log('🎉 전체 하트 구매 과정 완료 - 완전한 동기식 플로우');
      return {
        success: true,
        // 결제 정보
        paymentResult,
        // 백엔드 완전한 응답
        backendResponse: chargeResult,
        // 하트 정보 (UI 업데이트용)
        hearts: chargeResult.hearts,
        // 구매 정보
        purchase: {
          packageId: heartPackage.id,
          packageName: heartPackage.name,
          addedHearts: chargeResult.hearts.addedHearts,
          previousBalance: chargeResult.hearts.previousBalance,
          newBalance: chargeResult.hearts.newBalance
        },
        // 팝업 메시지
        popup: {
          title: '하트 충전 완료!',
          message: chargeResult.message,
          subtitle: chargeResult.subtitle
        },
        // 레거시 호환용
        currentHeartBalance: chargeResult.hearts.newBalance,
        addedHearts: chargeResult.hearts.addedHearts,
        message: chargeResult.message
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

// 싱글톤 패턴으로 인스턴스 관리
let paymentServiceInstance = null;

export const getPaymentService = () => {
  if (!paymentServiceInstance) {
    paymentServiceInstance = new PaymentService();
  }
  return paymentServiceInstance;
};

export default PaymentService; 