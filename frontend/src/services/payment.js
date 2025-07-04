// 💳 포트원(아임포트) + KG이니시스 결제 서비스

class PaymentService {
  constructor() {
    this.IMP_CODE = 'imp_golfpe01'; // 포트원 가맹점 식별코드
    this.PG_PROVIDER = 'MOIplay998'; // KG이니시스 MID
    this.CHANNEL_KEY = 'channel-key-ea1faf0d-5e9a-4638-bdfe-596ef5794e83';
    
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
      const script = document.createElement('script');
      script.src = 'https://cdn.iamport.kr/v1/iamport.js';
      script.onload = () => {
        if (window.IMP) {
          window.IMP.init(this.IMP_CODE);
          this.isSDKLoaded = true;
          console.log('✅ 포트원 SDK 로드 완료');
          resolve();
        } else {
          reject(new Error('포트원 SDK 로드 실패'));
        }
      };
      script.onerror = () => reject(new Error('포트원 SDK 스크립트 로드 실패'));
      document.head.appendChild(script);
    });
  }

  // 결제 요청
  async requestPayment(paymentData) {
    try {
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
            reject({
              success: false,
              error: response.error_msg,
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