// 앱 브릿지 - 웹뷰와 앱 간 통신을 위한 유틸리티
// 웹 환경에서는 기본적으로 비활성화되고, 필요시에만 최소한으로 사용

const appBridge = {
  // 앱 환경 감지
  isAppEnvironment() {
    return window.ReactNativeWebView !== undefined || 
           navigator.userAgent.includes('WebView') ||
           navigator.userAgent.includes('wv') ||
           navigator.userAgent.includes('MinglingApp') ||
           window.IS_NATIVE_APP === true;
  },

  // Firebase 토큰 가져오기
  async getFirebaseToken() {
    try {
      // Firebase Auth에서 현재 사용자의 토큰 가져오기
      const auth = window.firebase?.auth();
      if (auth && auth.currentUser) {
        const token = await auth.currentUser.getIdToken();
        console.log('🔐 Firebase 토큰 획득 성공');
        return token;
      }
      console.warn('⚠️ Firebase Auth 또는 사용자를 찾을 수 없음');
      return null;
    } catch (error) {
      console.error('❌ Firebase 토큰 획득 실패:', error);
      return null;
    }
  },

  // 로그인 성공 알림 (앱에만 전달)
  sendLoginSuccess(token) {
    if (this.isAppEnvironment() && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'LOGIN_SUCCESS',
          token: token,
          timestamp: Date.now()
        }));
        console.log('📱 앱에 로그인 성공 알림 전송:', token.substring(0, 20) + '...');
      } catch (error) {
        console.error('❌ 앱 로그인 알림 전송 실패:', error);
      }
    }
  },

  // 로그아웃 알림 (앱에만 전달)
  sendLogout() {
    if (this.isAppEnvironment() && window.ReactNativeWebView) {
      try {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'LOGOUT',
          timestamp: Date.now()
        }));
        console.log('📱 앱에 로그아웃 알림 전송');
      } catch (error) {
        console.error('❌ 앱 로그아웃 알림 전송 실패:', error);
      }
    }
  },

  // 결제 요청 (앱에만 전달) - 인앱결제용
  async requestPayment(paymentData) {
    return new Promise(async (resolve, reject) => {
      if (!this.isAppEnvironment()) {
        reject(new Error('앱 환경이 아닙니다'));
        return;
      }

      try {
        // Firebase 토큰 가져오기
        const firebaseToken = await this.getFirebaseToken();
        
        // 사용자 정보 수집
        const userId = paymentData.userId || localStorage.getItem('userId');
        const userEmail = paymentData.userEmail || localStorage.getItem('userEmail');

        if (!userId || !userEmail) {
          reject(new Error('사용자 정보가 필요합니다'));
          return;
        }

        console.log('💰 인앱결제 요청 준비:', {
          userId,
          userEmail,
          hasToken: !!firebaseToken,
          productId: paymentData.productId
        });

        // 앱에서 결제 결과를 받기 위한 글로벌 콜백 설정
        window.handleNativePaymentResult = (result) => {
          console.log('💳 인앱결제 결과 수신:', result);
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error || '결제가 취소되었습니다'));
          }
          delete window.handleNativePaymentResult; // 콜백 정리
        };

        // 앱에 인앱결제 요청 전송 (앱에서 기대하는 형식)
        if (window.ReactNativeWebView) {
          const messageData = {
            type: 'openNativePayment',
            userToken: firebaseToken,
            userId: userId,
            userEmail: userEmail,
            productData: {
              productId: paymentData.productId,
              productName: paymentData.productName,
              amount: paymentData.amount,
              hearts: paymentData.hearts
            },
            timestamp: Date.now()
          };

          // JSON과 단순 문자열 둘 다 지원
          window.ReactNativeWebView.postMessage(JSON.stringify(messageData));
          
          console.log('📱 앱에 인앱결제 요청 전송:', {
            type: messageData.type,
            userId: messageData.userId,
            userEmail: messageData.userEmail,
            productId: messageData.productData.productId,
            hasToken: !!messageData.userToken
          });

          // 백업으로 단순 문자열도 전송 (기존 호환성)
          setTimeout(() => {
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage('openNativePayment');
              console.log('📱 백업 메시지 전송: openNativePayment');
            }
          }, 100);

        } else {
          reject(new Error('React Native WebView를 찾을 수 없습니다'));
        }

        // 타임아웃 설정 (30초)
        setTimeout(() => {
          if (window.handleNativePaymentResult) {
            delete window.handleNativePaymentResult;
            reject(new Error('결제 요청 시간 초과'));
          }
        }, 30000);

      } catch (error) {
        console.error('❌ 인앱결제 요청 전송 실패:', error);
        reject(error);
      }
    });
  }
};

export default appBridge; 