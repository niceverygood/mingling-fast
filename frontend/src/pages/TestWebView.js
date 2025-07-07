import React from 'react';
import { useNavigate } from 'react-router-dom';
import { isWebView, goToHeartShop, goToHeartShopWithAlert } from '../utils/webview';

const TestWebView = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen p-4">
      <h1 className="text-2xl font-bold mb-6">WebView 테스트</h1>
      
      <div className="space-y-4">
        {/* 환경 감지 */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <h2 className="font-medium mb-2">현재 환경</h2>
          <p className="text-sm">
            {isWebView() ? '📱 React Native WebView' : '🌐 웹 브라우저'}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            window.ReactNativeWebView: {window.ReactNativeWebView ? '있음' : '없음'}
          </p>
        </div>

        {/* 테스트 버튼들 */}
        <div className="space-y-3">
          <button
            onClick={() => goToHeartShop(navigate)}
            className="w-full bg-pink-500 text-white py-3 rounded-lg font-medium"
          >
            하트샵 이동 테스트
          </button>

          <button
            onClick={() => goToHeartShopWithAlert(navigate)}
            className="w-full bg-red-500 text-white py-3 rounded-lg font-medium"
          >
            하트 부족 알림 테스트
          </button>

          <button
            onClick={() => {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage('openNativePayment');
              } else {
                alert('WebView 환경이 아닙니다.');
              }
            }}
            className="w-full bg-blue-500 text-white py-3 rounded-lg font-medium"
          >
            직접 메시지 전송 테스트
          </button>

          <button
            onClick={() => {
              if (window.ReactNativeWebView) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'showHeartShopAlert',
                  message: '테스트 알림 메시지입니다.'
                }));
              } else {
                alert('WebView 환경이 아닙니다.');
              }
            }}
            className="w-full bg-purple-500 text-white py-3 rounded-lg font-medium"
          >
            JSON 메시지 전송 테스트
          </button>
        </div>

        {/* 뒤로가기 */}
        <button
          onClick={() => navigate(-1)}
          className="w-full bg-gray-500 text-white py-3 rounded-lg font-medium mt-6"
        >
          뒤로가기
        </button>
      </div>
    </div>
  );
};

export default TestWebView; 