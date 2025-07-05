// 💳 포트원(아임포트) + KG이니시스 결제 서비스

class PaymentService {
  constructor() {
    console.log('🔧 PaymentService 초기화 시작');
    
    // 포트원 V1 SDK 설정 (안정적인 버전)
    this.IMP_CODE = 'imp_golfpe01'; // 포트원 가맹점 식별코드
    this.PG_PROVIDER = 'html5_inicis.MOIplay998'; // KG이니시스 상점아이디
    this.CHANNEL_KEY = 'channel-key-720d69be-767a-420c-91c8-2855ca00192d'; // 새 채널키
    this.SIGN_KEY = 'TU5vYzk0L2Q2Z2ZaL28wN0JJczlVQT09'; // 웹결제 사인키
    
    console.log('📋 결제 설정 정보:', {
      IMP_CODE: this.IMP_CODE,
      PG_PROVIDER: this.PG_PROVIDER,
      CHANNEL_KEY: this.CHANNEL_KEY,
      SIGN_KEY: this.SIGN_KEY ? '설정됨' : '없음'
    });
    
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
              console.log('🔧 IMP.init 호출:', this.IMP_CODE);
              window.IMP.init(this.IMP_CODE);
              this.isSDKLoaded = true;
              console.log('✅ 포트원 V1 SDK 초기화 완료:', this.IMP_CODE);
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
        pg: this.PG_PROVIDER, // KG이니시스 PG 설정
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
  async verifyPayment(impUid, merchantUid) {
    console.log('🔍 결제 검증 시작');
    console.log('📋 검증 정보:', { impUid, merchantUid });
    
    try {
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://api.minglingchat.com' 
        : 'http://localhost:8001';
      
      console.log('🌐 API 요청 URL:', `${API_BASE_URL}/api/payment/verify`);
      
      const headers = {
        'Content-Type': 'application/json',
        'X-User-Email': localStorage.getItem('userEmail'),
        'X-User-Id': localStorage.getItem('userId')
      };
      
      console.log('📋 요청 헤더:', headers);
      
      const body = {
        imp_uid: impUid,
        merchant_uid: merchantUid
      };
      
      console.log('📋 요청 본문:', body);
      
      const response = await fetch(`${API_BASE_URL}/api/payment/verify`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body)
      });

      console.log('📨 검증 응답 상태:', response.status);
      console.log('📨 검증 응답 헤더:', [...response.headers.entries()]);
      
      const result = await response.json();
      console.log('📨 검증 응답 내용:', result);
      
      if (!response.ok) {
        console.error('❌ 검증 실패:', result);
        throw new Error(result.error || '결제 검증 실패');
      }

      console.log('✅ 결제 검증 성공:', result);
      return result;
    } catch (error) {
      console.error('❌ 결제 검증 실패:', error);
      console.error('🔍 에러 상세:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
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
    return [
      {
        id: 'heart_50',
        name: '기본 팩',
        hearts: 50,
        price: 1000,
        originalPrice: 1000,
        discount: 0,
        popular: false
      },
      {
        id: 'heart_120',
        name: '인기 팩',
        hearts: 120,
        price: 2000,
        originalPrice: 2400,
        discount: 17,
        popular: true
      },
      {
        id: 'heart_300',
        name: '대용량 팩',
        hearts: 300,
        price: 4500,
        originalPrice: 6000,
        discount: 25,
        popular: false
      },
      {
        id: 'heart_500',
        name: '프리미엄 팩',
        hearts: 500,
        price: 7000,
        originalPrice: 10000,
        discount: 30,
        popular: false
      }
    ];
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
}

// 클래스만 export하고 필요할 때 인스턴스 생성
export default PaymentService; 