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

/**
 * 하트 부족 시 하트샵으로 이동하는 알림과 함께 처리
 * @param {Function} navigate - React Router의 navigate 함수 (웹용)
 * @param {Function} setShowHeartShop - 하트샵 모달 표시 함수 (웹용)
 */
export const goToHeartShopWithAlert = (navigate, setShowHeartShop) => {
  if (isWebView()) {
    // 앱(WebView) 환경: 네이티브 알림 후 네이티브 결제 화면으로 이동
    console.log('📱 WebView 환경: 하트 부족 알림 후 네이티브 결제 화면으로 이동');
    // 네이티브 앱에서 알림을 처리하도록 메시지 전송
    window.ReactNativeWebView.postMessage(JSON.stringify({
      type: 'showHeartShopAlert',
      message: '하트가 부족합니다. 하트를 충전하시겠습니까?'
    }));
  } else {
    // 웹 브라우저 환경: 웹 알림 후 웹 하트샵으로 이동
    console.log('🌐 웹 브라우저 환경: 하트 부족 알림 후 웹 하트샵으로 이동');
    const confirmed = window.confirm('하트가 부족합니다. 하트를 충전하시겠습니까?');
    if (confirmed) {
      goToHeartShop(navigate, setShowHeartShop);
    }
  }
}; 