// 💳 포트원(아임포트) + KG이니시스 결제 서비스

class PaymentService {
  constructor() {
    console.log('🔧 PaymentService 초기화 시작');
    
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
    // 생성자에서 바로 로드하지 않고 필요할 때만 로드하도록 변경
    // this.loadSDK();
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
            console.error('🔍 사용 가능한 전역 객체:', Object.keys(window).filter(key => 
              key.toLowerCase().includes('imp') || 
              key.toLowerCase().includes('payment')
            ));
            reject(new Error('포트원 SDK 로드 실패'));
          }
        }, 500); // 더 긴 대기 시간
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
      // 포트원 설정 문제시 임시 테스트 모드
      const USE_TEST_MODE = false; // 실제 결제 테스트를 위해 false로 설정
      
      if (USE_TEST_MODE) {
        console.log('🧪 테스트 결제 모드 활성화');
        return this.mockPayment(paymentData);
      }
      
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
            console.error('🔍 현재 window 객체:', {
              IMP: window.IMP,
              keys: Object.keys(window).filter(key => 
                key.toLowerCase().includes('imp')
              )
            });
            reject(new Error('포트원 SDK가 로드되지 않았습니다'));
          }
        } catch (error) {
          console.error('💥 결제 요청 중 예외 발생:', error);
          console.error('🔍 에러 상세:', {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          reject({
            success: false,
            error: error.message || '결제 요청 실패',
            code: 'SDK_ERROR'
          });
        }
      });

    } catch (error) {
      console.error('❌ 결제 요청 최종 실패:', error);
      console.error('🔍 에러 상세:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // 결제 검증 (백엔드 API 호출)
  async verifyPayment(imp_uid, merchant_uid, userId, userEmail) {
    console.log('🔍 결제 검증 요청 시작', {
      imp_uid,
      merchant_uid,
      userId,
      userEmail
    });

    return await this.verifyPaymentWithRetry(imp_uid, merchant_uid, userId, userEmail, 3);
  }

  // 재시도 로직이 포함된 결제 검증
  async verifyPaymentWithRetry(imp_uid, merchant_uid, userId, userEmail, maxRetries = 3) {
    console.log('🔄 결제 검증 재시도 로직 시작', {
      imp_uid,
      merchant_uid,
      userId,
      userEmail,
      maxRetries
    });

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`🔍 결제 검증 시도 ${attempt}/${maxRetries}`);
      
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

        console.log('🌐 API 요청 전송 중...');
        const response = await fetch(`${this.apiUrl}/payment/verify`, {
          method: 'POST',
          headers: requestHeaders,
          body: JSON.stringify(requestData)
        });

        console.log('📨 응답 수신:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok,
          attempt: attempt
        });

        const responseData = await response.json();
        console.log('📋 응답 데이터:', responseData);

        if (!response.ok) {
          console.error('❌ HTTP 오류 응답:', {
            status: response.status,
            error: responseData.error,
            attempt: attempt
          });
          
          // 웹훅 처리 대기 중인 경우
          if (responseData.error === '결제 검증 진행 중' && attempt < maxRetries) {
            console.log(`⏳ 웹훅 처리 대기 중... ${responseData.retry_after || 3000}ms 후 재시도`);
            await new Promise(resolve => setTimeout(resolve, responseData.retry_after || 3000));
            continue;
          }
          
          throw new Error(responseData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

        if (!responseData.success) {
          console.error('❌ 검증 실패:', responseData.error);
          
          // 웹훅 처리 대기 중인 경우
          if (responseData.error === '결제 검증 진행 중' && attempt < maxRetries) {
            console.log(`⏳ 웹훅 처리 대기 중... ${responseData.retry_after || 3000}ms 후 재시도`);
            await new Promise(resolve => setTimeout(resolve, responseData.retry_after || 3000));
            continue;
          }
          
          throw new Error(responseData.error || '결제 검증에 실패했습니다');
        }

        console.log(`✅ 결제 검증 성공 (시도 ${attempt}/${maxRetries})`);
        return responseData.verification || responseData;

      } catch (error) {
        console.error(`❌ 검증 시도 ${attempt}/${maxRetries} 실패:`, error);
        
        // 마지막 시도가 아닌 경우 재시도
        if (attempt < maxRetries) {
          const retryDelay = attempt * 2000; // 2초, 4초, 6초...
          console.log(`⏳ ${retryDelay}ms 후 재시도...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay));
          continue;
        }
        
        // 모든 시도 실패
        throw error;
      }
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

  // 테스트용 결제 (개발 환경)
  async mockPayment(paymentData) {
    console.log('🧪 테스트 결제 시작:', paymentData);
    
    return new Promise((resolve, reject) => {
      // 2초 후 결제 성공으로 시뮬레이션
      setTimeout(() => {
        const shouldSucceed = Math.random() > 0.2; // 80% 성공률
        
        if (shouldSucceed) {
          const result = {
            success: true,
            impUid: `test_imp_${Date.now()}`,
            merchantUid: this.generateOrderId(),
            amount: paymentData.amount,
            status: 'paid'
          };
          console.log('✅ 테스트 결제 성공:', result);
          resolve(result);
        } else {
          const error = {
            success: false,
            error: '테스트 결제 실패 (랜덤)',
            code: 'TEST_FAIL'
          };
          console.error('❌ 테스트 결제 실패:', error);
          reject(error);
        }
      }, 2000);
    });
  }

  // 하트 상품 정보
  getHeartProducts() {
    return this.heartPackages;
  }

  // 결제 완료 후 하트 지급
  async completeHeartPurchase(paymentResult, productInfo) {
    console.log('💖 하트 지급 시작');
    console.log('📋 결제 결과:', paymentResult);
    console.log('📋 상품 정보:', productInfo);
    
    try {
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://api.minglingchat.com' 
        : 'http://localhost:8001';
      
      console.log('🌐 API 요청 URL:', `${API_BASE_URL}/api/payment/hearts/purchase`);
      
      const headers = {
        'Content-Type': 'application/json',
        'X-User-Email': localStorage.getItem('userEmail'),
        'X-User-Id': localStorage.getItem('userId')
      };
      
      console.log('📋 요청 헤더:', headers);
      
      const body = {
        imp_uid: paymentResult.impUid,
        merchant_uid: paymentResult.merchantUid,
        product_id: productInfo.id,
        heart_amount: productInfo.hearts,
        paid_amount: paymentResult.amount
      };
      
      console.log('📋 요청 본문:', body);
      
      const response = await fetch(`${API_BASE_URL}/api/payment/hearts/purchase`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      console.log('📨 하트 지급 응답 상태:', response.status);
      console.log('📨 하트 지급 응답 헤더:', [...response.headers.entries()]);
      
      const result = await response.json();
      console.log('📨 하트 지급 응답 내용:', result);
      
      if (!response.ok) {
        console.error('❌ 하트 지급 실패:', result);
        throw new Error(result.error || '하트 지급 실패');
      }

      console.log('✅ 하트 지급 성공:', result);
      return result;
    } catch (error) {
      console.error('❌ 하트 지급 실패:', error);
      console.error('🔍 에러 상세:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // 하트 구매 요청
  async purchaseHearts(packageId, userInfo = {}) {
    console.log('🛒 1단계: 하트 구매 시작', { packageId, userInfo });
    
    try {
      // 1단계: 하트 패키지 검증
      const heartPackage = this.heartPackages.find(pkg => pkg.id === packageId);
      if (!heartPackage) {
        throw new Error('유효하지 않은 하트 패키지입니다.');
      }
      console.log('✅ 1단계 완료: 하트 패키지 검증', heartPackage);

      // 2단계: 사용자 정보 확인 - 다양한 소스에서 가져오기
      console.log('👤 2단계: 사용자 정보 확인 중...');
      
      // 여러 소스에서 사용자 정보 수집
      const userEmail = userInfo.email || 
                       localStorage.getItem('userEmail') || 
                       sessionStorage.getItem('userEmail') ||
                       this.getUserEmailFromAuth() ||
                       'user@minglingchat.com';
      
      const userId = userInfo.userId || 
                    localStorage.getItem('userId') || 
                    sessionStorage.getItem('userId') ||
                    this.getUserIdFromAuth() ||
                    'guest';
      
      console.log('📋 수집된 사용자 정보:', {
        email: userEmail,
        userId: userId,
        originalUserInfo: userInfo,
        localStorage: {
          email: localStorage.getItem('userEmail'),
          userId: localStorage.getItem('userId')
        },
        sessionStorage: {
          email: sessionStorage.getItem('userEmail'),
          userId: sessionStorage.getItem('userId')
        }
      });
      
      if (!userEmail || userEmail === 'user@minglingchat.com') {
        console.warn('⚠️ 기본 이메일 사용 중 - 실제 사용자 정보를 찾을 수 없음');
      }
      
      console.log('✅ 2단계 완료: 사용자 정보 확인', { userEmail, userId });

      // 3단계: 포트원 SDK 로드
      console.log('📦 3단계: 포트원 SDK 로드 중...');
      try {
        await this.loadSDK();
        console.log('✅ 3단계 성공: 포트원 SDK 로드 완료');
      } catch (sdkError) {
        console.error('❌ 3단계 실패: 포트원 SDK 로드 실패', {
          error: sdkError.message,
          stack: sdkError.stack
        });
        throw new Error('결제 시스템 로드에 실패했습니다. 페이지를 새로고침해주세요.');
      }

      // 4단계: merchant_uid 생성
      console.log('🔑 4단계: merchant_uid 생성 중...');
      const merchantUid = `hearts_${userId}_${Date.now()}`;
      console.log('✅ 4단계 성공: merchant_uid 생성 완료', {
        merchantUid,
        format: 'hearts_{userId}_{timestamp}'
      });

      // 5단계: 결제 데이터 준비
      console.log('💳 5단계: 결제 데이터 준비 중...');
      
      // 구매자 정보 더 상세하게 설정 - 실제 로그인 사용자 정보 사용
      const actualUserEmail = userEmail || localStorage.getItem('userEmail') || userInfo.email;
      const buyerName = userInfo.name || actualUserEmail?.split('@')[0] || '밍글링 사용자';
      const buyerEmail = actualUserEmail || 'user@minglingchat.com';
      const buyerTel = userInfo.phone || '010-1234-5678';
      
      console.log('👤 구매자 정보 설정:', {
        buyerName,
        buyerEmail,
        buyerTel,
        originalUserInfo: userInfo,
        actualUserEmail,
        localStorageEmail: localStorage.getItem('userEmail')
      });
      
      const paymentData = {
        pg: this.pgProvider,
        pay_method: 'card',
        merchant_uid: merchantUid,
        name: `하트 ${heartPackage.hearts}개`,
        amount: heartPackage.price,
        buyer_email: buyerEmail,
        buyer_name: buyerName,
        buyer_tel: buyerTel,
        buyer_addr: userInfo.address || '서울특별시 강남구',
        buyer_postcode: userInfo.postcode || '06292',
        m_redirect_url: `${window.location.origin}/payment/result`,
        custom_data: {
          userId: userId,
          packageId: packageId,
          hearts: heartPackage.hearts
        }
      };

      console.log('✅ 5단계 성공: 결제 데이터 준비 완료', {
        pg: paymentData.pg,
        amount: paymentData.amount,
        name: paymentData.name,
        merchant_uid: paymentData.merchant_uid,
        customData: paymentData.custom_data
      });

      // 6단계: 포트원 결제 요청
      console.log('🚀 6단계: 포트원 결제 요청 시작...');
      console.log('📡 IMP.request_pay 호출 중...', {
        impCode: this.impCode,
        channelKey: this.channelKey,
        paymentData: paymentData
      });

      return new Promise((resolve, reject) => {
        window.IMP.request_pay(paymentData, async (rsp) => {
          console.log('📨 포트원 결제 응답 수신:', {
            timestamp: new Date().toISOString(),
            success: rsp.success,
            error_code: rsp.error_code,
            error_msg: rsp.error_msg,
            imp_uid: rsp.imp_uid,
            merchant_uid: rsp.merchant_uid,
            pay_method: rsp.pay_method,
            paid_amount: rsp.paid_amount,
            status: rsp.status,
            name: rsp.name,
            pg_provider: rsp.pg_provider,
            pg_tid: rsp.pg_tid,
            buyer_name: rsp.buyer_name,
            buyer_email: rsp.buyer_email,
            buyer_tel: rsp.buyer_tel,
            buyer_addr: rsp.buyer_addr,
            buyer_postcode: rsp.buyer_postcode,
            custom_data: rsp.custom_data,
            paid_at: rsp.paid_at,
            receipt_url: rsp.receipt_url
          });

          if (rsp.success) {
            console.log('✅ 6단계 성공: 포트원 결제 완료');
            
            // 7단계: 결제 검증 요청
            console.log('🔍 7단계: 결제 검증 요청 시작...');
            try {
              const verificationResult = await this.verifyPayment(rsp.imp_uid, rsp.merchant_uid, userId, userEmail);
              console.log('✅ 7단계 성공: 결제 검증 완료', verificationResult);
              
              // 8단계: 성공 응답
              console.log('🎉 8단계: 하트 구매 성공 완료');
              resolve({
                success: true,
                imp_uid: rsp.imp_uid,
                merchant_uid: rsp.merchant_uid,
                verification: verificationResult,
                paymentInfo: {
                  amount: rsp.paid_amount,
                  method: rsp.pay_method,
                  pg_provider: rsp.pg_provider,
                  paid_at: rsp.paid_at,
                  receipt_url: rsp.receipt_url
                }
              });
              
              console.log('🔥 ===== 하트 구매 프로세스 성공 완료 =====');
              
            } catch (verificationError) {
              console.error('❌ 7단계 실패: 결제 검증 실패', {
                error: verificationError.message,
                imp_uid: rsp.imp_uid,
                merchant_uid: rsp.merchant_uid,
                stack: verificationError.stack
              });
              
              reject(new Error(`결제는 완료되었지만 검증에 실패했습니다: ${verificationError.message}`));
            }
          } else {
            console.error('❌ 6단계 실패: 포트원 결제 실패', {
              error_code: rsp.error_code,
              error_msg: rsp.error_msg,
              imp_uid: rsp.imp_uid,
              merchant_uid: rsp.merchant_uid
            });
            
            reject(new Error(rsp.error_msg || '결제에 실패했습니다'));
          }
        });
      });

    } catch (error) {
      console.error('❌ 전체 프로세스 실패: 예상치 못한 오류', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        packageId,
        userInfo
      });
      
      console.log('🔥 ===== 하트 구매 프로세스 실패 완료 =====');
      throw error;
    }
  }

  // 헬퍼 메서드들
  getUserEmailFromAuth() {
    // AuthContext나 다른 인증 시스템에서 이메일 가져오기
    try {
      // window.auth나 다른 전역 인증 객체에서 가져오기
      if (window.auth && window.auth.currentUser) {
        return window.auth.currentUser.email;
      }
      
      // React Context에서 가져오기 (가능한 경우)
      if (window.authContext && window.authContext.user) {
        return window.authContext.user.email;
      }
      
      return null;
    } catch (error) {
      console.warn('Auth에서 이메일 가져오기 실패:', error);
      return null;
    }
  }

  getUserIdFromAuth() {
    // AuthContext나 다른 인증 시스템에서 사용자 ID 가져오기
    try {
      if (window.auth && window.auth.currentUser) {
        return window.auth.currentUser.uid;
      }
      
      if (window.authContext && window.authContext.user) {
        return window.authContext.user.uid;
      }
      
      return null;
    } catch (error) {
      console.warn('Auth에서 사용자 ID 가져오기 실패:', error);
      return null;
    }
  }

  getHeartPackage(packageId) {
    return this.heartPackages.find(pkg => pkg.id === packageId);
  }
}

// 클래스만 export하고 필요할 때 인스턴스 생성
export default PaymentService; 