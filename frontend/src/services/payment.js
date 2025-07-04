// 💳 포트원(아임포트) + KG이니시스 결제 서비스

class PaymentService {
  constructor() {
    this.IMP_CODE = 'imp_golfpe01'; // 포트원 가맹점 식별코드
    this.PG_PROVIDER = 'MOIplay998'; // KG이니시스 MID
    this.CHANNEL_KEY = 'channel-key-ea1faf0d-5e9a-4638-bdfe-596ef5794e83';
    this.SIGN_KEY = 'TU5vYzk0L2Q2Z2ZaL28wN0JJczlVQT09'; // 웹결제 signkey
    
    // 포트원 SDK 로드 상태
    this.isSDKLoaded = false;
    this.loadSDK();
  }

  // 포트원 SDK 로드
  async loadSDK() {
    if (this.isSDKLoaded || window.IMP) {
      this.isSDKLoaded = true;
      return;
    }

    return new Promise((resolve, reject) => {
      // 기존 스크립트 제거
      const existingScript = document.querySelector('script[src*="iamport"]');
      if (existingScript) {
        existingScript.remove();
      }
      
      const script = document.createElement('script');
      script.src = 'https://cdn.iamport.kr/v1/iamport.js';
      script.async = true;
      script.onload = () => {
        console.log('📦 포트원 SDK 스크립트 로드됨');
        
        // 잠시 대기 후 초기화
        setTimeout(() => {
          if (window.IMP) {
            try {
              window.IMP.init(this.IMP_CODE);
              this.isSDKLoaded = true;
              console.log('✅ 포트원 SDK 초기화 완료:', this.IMP_CODE);
              resolve();
            } catch (error) {
              console.error('❌ 포트원 SDK 초기화 실패:', error);
              reject(error);
            }
          } else {
            console.error('❌ window.IMP 객체를 찾을 수 없음');
            reject(new Error('포트원 SDK 로드 실패'));
          }
        }, 100);
      };
      script.onerror = (error) => {
        console.error('❌ 포트원 SDK 스크립트 로드 실패:', error);
        reject(new Error('포트원 SDK 스크립트 로드 실패'));
      };
      document.head.appendChild(script);
    });
  }

  // 결제 요청
  async requestPayment(paymentData) {
    try {
      // 개발 환경에서 테스트 모드 확인
      if (process.env.NODE_ENV === 'development') {
        console.log('🧪 개발 환경 - 테스트 결제 모드');
        return this.mockPayment(paymentData);
      }
      
      // SDK 로드 확인
      if (!this.isSDKLoaded) {
        await this.loadSDK();
      }

      // 결제 데이터 구성
      const paymentParams = {
        pg: `kcp.${this.PG_PROVIDER}`, // KG이니시스 설정
        pay_method: 'card', // 결제 방법
        merchant_uid: this.generateOrderId(), // 주문번호
        name: paymentData.productName, // 상품명
        amount: paymentData.amount, // 결제 금액
        buyer_email: paymentData.userEmail,
        buyer_name: paymentData.userName,
        buyer_tel: paymentData.userPhone || '010-0000-0000',
        buyer_addr: '서울특별시',
        buyer_postcode: '06018',
        // 포트원 V2 설정
        channelKey: this.CHANNEL_KEY,
        // 모바일 환경 대응
        m_redirect_url: `${window.location.origin}/payment/result`,
        // 커스텀 데이터
        custom_data: {
          userId: paymentData.userId,
          productType: paymentData.productType,
          heartAmount: paymentData.heartAmount
        }
      };

      console.log('💳 결제 요청:', paymentParams);

      // 결제 실행
      return new Promise((resolve, reject) => {
        if (!window.IMP) {
          reject(new Error('포트원 SDK가 로드되지 않았습니다'));
          return;
        }
        
        console.log('💳 결제 요청 시작:', paymentParams);
        
        window.IMP.request_pay(paymentParams, (response) => {
          console.log('💳 결제 응답:', response);
          
          if (response.success) {
            // 결제 성공
            resolve({
              success: true,
              impUid: response.imp_uid,
              merchantUid: response.merchant_uid,
              amount: response.paid_amount,
              status: response.status
            });
          } else {
            // 결제 실패
            const errorMsg = response.error_msg || '결제가 취소되었습니다';
            console.error('💳 결제 실패:', errorMsg, response.error_code);
            reject({
              success: false,
              error: errorMsg,
              code: response.error_code
            });
          }
        });
      });

    } catch (error) {
      console.error('❌ 결제 요청 실패:', error);
      throw error;
    }
  }

  // 결제 검증 (백엔드 API 호출)
  async verifyPayment(impUid, merchantUid) {
    try {
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://api.minglingchat.com' 
        : 'http://localhost:8001';
      
      const response = await fetch(`${API_BASE_URL}/api/payment/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': localStorage.getItem('userEmail'),
          'X-User-Id': localStorage.getItem('userId')
        },
        body: JSON.stringify({
          imp_uid: impUid,
          merchant_uid: merchantUid
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '결제 검증 실패');
      }

      return result;
    } catch (error) {
      console.error('❌ 결제 검증 실패:', error);
      throw error;
    }
  }

  // 주문번호 생성
  generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `HEART_${timestamp}_${random}`;
  }

  // 테스트용 결제 (개발 환경)
  async mockPayment(paymentData) {
    return new Promise((resolve, reject) => {
      // 2초 후 결제 성공으로 시뮬레이션
      setTimeout(() => {
        const shouldSucceed = Math.random() > 0.2; // 80% 성공률
        
        if (shouldSucceed) {
          resolve({
            success: true,
            impUid: `test_imp_${Date.now()}`,
            merchantUid: this.generateOrderId(),
            amount: paymentData.amount,
            status: 'paid'
          });
        } else {
          reject({
            success: false,
            error: '테스트 결제 실패 (랜덤)',
            code: 'TEST_FAIL'
          });
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
    try {
      const API_BASE_URL = process.env.NODE_ENV === 'production' 
        ? 'https://api.minglingchat.com' 
        : 'http://localhost:8001';
      
      const response = await fetch(`${API_BASE_URL}/api/payment/hearts/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': localStorage.getItem('userEmail'),
          'X-User-Id': localStorage.getItem('userId')
        },
        body: JSON.stringify({
          imp_uid: paymentResult.impUid,
          merchant_uid: paymentResult.merchantUid,
          product_id: productInfo.id,
          heart_amount: productInfo.hearts,
          paid_amount: paymentResult.amount
        })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '하트 지급 실패');
      }

      return result;
    } catch (error) {
      console.error('❌ 하트 지급 실패:', error);
      throw error;
    }
  }
}

// 전역 인스턴스 생성
const paymentService = new PaymentService();

export default paymentService; 