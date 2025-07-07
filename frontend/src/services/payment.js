// 💳 포트원(아임포트) + KG이니시스 결제 서비스

class PaymentService {
  constructor() {
    console.log('🔧 PaymentService 초기화 시작');
    
    // API URL 설정 (새 EC2 서버 IP)
    this.apiUrl = process.env.NODE_ENV === 'production' 
      ? 'https://api.minglingchat.com' 
      : 'http://3.35.49.121:8001/api';
    
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

  // 🚀 즉시 결제 검증 (웹훅 대신 사용)
  async verifyPayment(imp_uid, merchant_uid, userId, userEmail) {
    console.log('🔍 즉시 결제 검증 시작', {
      imp_uid,
      merchant_uid,
      userId,
      userEmail
    });

    try {
      const requestData = {
        imp_uid,
        merchant_uid
      };

      const requestHeaders = {
        'Content-Type': 'application/json',
        'X-User-ID': userId,
        'X-User-Email': userEmail || ''
      };

      console.log('🌐 검증 API 요청 전송:', {
        url: `${this.apiUrl}/payment/verify`,
        headers: requestHeaders,
        data: requestData
      });

      const response = await fetch(`${this.apiUrl}/payment/verify`, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(requestData)
      });

      console.log('📨 검증 응답 수신:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      const responseData = await response.json();
      console.log('📋 검증 응답 데이터:', responseData);

      if (!response.ok) {
        console.error('❌ 검증 HTTP 오류:', {
          status: response.status,
          error: responseData.error
        });
        throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      if (!responseData.success) {
        console.error('❌ 검증 실패:', responseData.error);
        throw new Error(responseData.error || '결제 검증에 실패했습니다');
      }

      console.log('✅ 즉시 결제 검증 성공');
      return responseData.verification || responseData;

    } catch (error) {
      console.error('❌ 즉시 결제 검증 실패:', error);
      throw error;
    }
  }

  // 주문번호 생성
  generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    const orderId = `HEART_${timestamp}_${random}`;
    console.log('🆔 주문번호 생성:', orderId);
    return orderId;
  }

  // 하트 상품 정보
  getHeartProducts() {
    return this.heartPackages;
  }

  // 🎯 메인 하트 구매 함수 (웹훅 대신 즉시 검증)
  async purchaseHearts(packageId, userInfo = {}) {
    console.log('🛒 하트 구매 시작 (즉시 검증 방식)', { packageId, userInfo });
    
    try {
      // 1단계: 하트 패키지 검증
      const heartPackage = this.heartPackages.find(pkg => pkg.id === packageId);
      if (!heartPackage) {
        throw new Error('유효하지 않은 하트 패키지입니다.');
      }
      console.log('✅ 1단계: 하트 패키지 검증 완료', heartPackage);

      // 2단계: 사용자 정보 수집 (개선된 로직)
      console.log('👤 2단계: 사용자 정보 수집 중...');
      console.log('📋 전달받은 userInfo:', userInfo);
      console.log('📋 localStorage 상태:', {
        userEmail: localStorage.getItem('userEmail'),
        userId: localStorage.getItem('userId'),
        authData: localStorage.getItem('authData')
      });
      
      // userInfo에서 우선 확인
      let userEmail = userInfo.email;
      let userId = userInfo.userId;
      
      // userInfo가 없으면 localStorage에서 확인
      if (!userEmail || userEmail === 'user@minglingchat.com') {
        userEmail = localStorage.getItem('userEmail');
      }
      if (!userId || userId === 'guest') {
        userId = localStorage.getItem('userId');
      }
      
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
      
      // 기본값 설정 (최후의 수단)
      if (!userEmail || userEmail === 'user@minglingchat.com') {
        userEmail = 'user@minglingchat.com';
        console.warn('⚠️ 실제 사용자 이메일을 찾을 수 없어 기본값 사용');
      }
      if (!userId || userId === 'guest') {
        userId = 'guest';
        console.warn('⚠️ 실제 사용자 ID를 찾을 수 없어 기본값 사용');
      }
      
      console.log('✅ 2단계: 최종 사용자 정보 확인 완료', { userEmail, userId });

      // 3단계: 결제 요청
      console.log('💳 3단계: 결제 요청 시작');
      const paymentData = {
        productName: heartPackage.name,
        amount: heartPackage.price,
        userEmail: userEmail,
        userName: userInfo.name || userEmail.split('@')[0],
        userPhone: userInfo.phone || '010-0000-0000',
        userId: userId,
        productType: 'hearts',
        heartAmount: heartPackage.hearts
      };

      console.log('📋 결제 데이터 최종 확인:', paymentData);
      const paymentResult = await this.requestPayment(paymentData);
      console.log('✅ 3단계: 결제 완료', paymentResult);

      // 4단계: 즉시 결제 검증 및 하트 지급
      console.log('🔍 4단계: 즉시 결제 검증 시작');
      const verification = await this.verifyPayment(
        paymentResult.impUid,
        paymentResult.merchantUid,
        userId,
        userEmail
      );
      console.log('✅ 4단계: 결제 검증 및 하트 지급 완료', verification);

      // 5단계: 성공 응답 반환
      console.log('🎉 전체 하트 구매 과정 완료');
      return {
        success: true,
        verification: verification,
        impUid: paymentResult.impUid,
        merchantUid: paymentResult.merchantUid,
        amount: paymentResult.amount,
        hearts: heartPackage.hearts,
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