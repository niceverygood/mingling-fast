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

  // 결제 요청 (앱에만 전달)
  requestPayment(paymentData) {
    return new Promise((resolve, reject) => {
      if (!this.isAppEnvironment()) {
        reject(new Error('앱 환경이 아닙니다'));
        return;
      }

      try {
        // 앱에서 결제 결과를 받기 위한 글로벌 콜백 설정
        window.handlePaymentResult = (result) => {
          if (result.success) {
            resolve(result);
          } else {
            reject(new Error(result.error || '결제가 취소되었습니다'));
          }
          delete window.handlePaymentResult; // 콜백 정리
        };

        // 앱에 결제 요청 전송
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'PAYMENT_REQUEST',
            data: paymentData,
            timestamp: Date.now()
          }));
          console.log('📱 앱에 결제 요청 전송:', paymentData);
        } else {
          reject(new Error('React Native WebView를 찾을 수 없습니다'));
        }
      } catch (error) {
        console.error('❌ 결제 요청 전송 실패:', error);
        reject(error);
      }
    });
  }
};

export default appBridge; 