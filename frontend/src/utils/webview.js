// WebView 감지 및 네이티브 결제 처리 유틸리티

/**
 * 현재 환경이 React Native WebView인지 확인
 * @returns {boolean} WebView 환경 여부
 */
export const isWebView = () => {
  return typeof window !== 'undefined' && window.ReactNativeWebView;
};

/**
 * 하트샵으로 이동 (WebView인 경우 네이티브 결제 화면, 웹인 경우 웹 결제 화면)
 * @param {Function} navigate - React Router의 navigate 함수 (웹용)
 * @param {Function} setShowHeartShop - 하트샵 모달 표시 함수 (웹용)
 */
export const goToHeartShop = (navigate, setShowHeartShop) => {
  if (isWebView()) {
    // 앱(WebView) 환경: 네이티브 결제 화면으로 이동
    console.log('📱 WebView 환경 감지: 네이티브 결제 화면으로 이동');
    window.ReactNativeWebView.postMessage('openNativePayment');
  } else {
    // 웹 브라우저 환경: 웹 하트샵으로 이동
    console.log('🌐 웹 브라우저 환경: 웹 하트샵으로 이동');
    if (setShowHeartShop) {
      // 모달 방식
      setShowHeartShop(true);
    } else if (navigate) {
      // 페이지 이동 방식
      navigate('/heart-shop');
    }
  }
};

// 웹뷰에서 네이티브 앱과 통신하기 위한 유틸리티 함수들

/**
 * 모바일 앱 환경인지 확인
 */
export const isInApp = () => {
  return window.ReactNativeWebView !== undefined;
};

/**
 * 네이티브 앱에 메시지 전송
 */
export const sendMessageToNative = (message) => {
  if (isInApp() && window.ReactNativeWebView) {
    window.ReactNativeWebView.postMessage(JSON.stringify(message));
  }
};

/**
 * 네이티브 하트샵 열기
 */
export const openNativeHeartShop = (currentHearts = 150) => {
  if (isInApp()) {
    console.log('📱 네이티브 하트샵 열기:', currentHearts);
    sendMessageToNative({
      type: 'showHeartShopAlert',
      hearts: currentHearts
    });
  } else {
    console.log('🌐 웹 환경에서 하트샵 열기');
    // 웹 환경에서는 기존 방식으로 처리
    return false;
  }
};

/**
 * 하트 부족 알림 (기존 함수 개선)
 */
export const goToHeartShopWithAlert = (currentHearts = 150) => {
  if (isInApp()) {
    // 네이티브 앱에서는 네이티브 하트샵 열기
    openNativeHeartShop(currentHearts);
  } else {
    // 웹에서는 기존 방식 유지
    const userConfirmed = window.confirm('하트가 부족합니다. 하트샵으로 이동하시겠습니까?');
    if (userConfirmed) {
      window.location.href = '/heart-shop';
    }
  }
};

/**
 * 네이티브 앱에서 하트 업데이트 수신 리스너
 */
export const listenForHeartUpdates = (callback) => {
  if (isInApp()) {
    const handleMessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        if (message.type === 'heartUpdated') {
          callback(message.hearts);
        }
      } catch (error) {
        console.error('Error parsing native message:', error);
      }
    };

    window.addEventListener('message', handleMessage);
    
    // 리스너 정리 함수 반환
    return () => window.removeEventListener('message', handleMessage);
  }
  
  return () => {}; // 웹 환경에서는 빈 함수 반환
};

/**
 * 외부 URL 열기 (네이티브 브라우저)
 */
export const openExternalUrl = (url, title = 'URL 열기') => {
  if (isInApp()) {
    sendMessageToNative({
      type: 'openUrl',
      url: url,
      title: title
    });
  } else {
    window.open(url, '_blank');
  }
};

/**
 * 네이티브 결제 화면 열기 (향후 확장용)
 */
export const openNativePayment = (paymentData) => {
  if (isInApp()) {
    sendMessageToNative({
      type: 'openNativePayment',
      data: paymentData
    });
  } else {
    console.warn('Native payment only available in app');
  }
};

/**
 * 하트 잔액 실시간 동기화
 */
export const syncHeartBalance = async () => {
  try {
    const response = await fetch('/api/hearts/sync', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      return data.data.hearts;
    }
  } catch (error) {
    console.error('Error syncing heart balance:', error);
  }
  
  return null;
};

/**
 * 앱/웹 환경에 맞는 하트샵 열기
 */
export const openHeartShop = (currentHearts = 150) => {
  if (isInApp()) {
    openNativeHeartShop(currentHearts);
  } else {
    // 웹에서는 페이지 이동
    window.location.href = '/heart-shop';
  }
}; 