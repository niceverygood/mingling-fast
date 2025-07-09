import React from 'react';
import { XMarkIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { isWebView } from '../../utils/webview';

const Settings = ({ onClose }) => {
  const { logout, isLoggedIn } = useAuth();
  const navigate = useNavigate();

  const handleServiceTerms = () => {
    // WebView 환경 감지
    if (isWebView()) {
      // WebView에서는 네이티브 앱에 메시지 전송
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'openUrl',
          url: 'https://minglingchat.com/terms',
          title: '서비스 이용약관'
        }));
      }
    } else {
      // 일반 브라우저에서는 내부 페이지로 이동
      navigate('/terms-of-service');
    }
  };

  const handlePrivacyPolicy = () => {
    // WebView 환경 감지
    if (isWebView()) {
      // WebView에서는 네이티브 앱에 메시지 전송
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'openUrl',
          url: 'https://minglingchat.com/privacy',
          title: '개인정보 처리방침'
        }));
      }
    } else {
      // 일반 브라우저에서는 내부 페이지로 이동
      navigate('/privacy-policy');
    }
  };

  const handleLogout = async () => {
    if (window.confirm('로그아웃 하시겠습니까?')) {
      try {
        const result = await logout();
        if (result.success) {
          alert('로그아웃되었습니다.');
          onClose();
        } else {
          alert('로그아웃에 실패했습니다.');
        }
      } catch (error) {
        console.error('Logout error:', error);
        alert('로그아웃 중 오류가 발생했습니다.');
      }
    }
  };

  const handleDeleteAccount = () => {
    if (window.confirm('정말로 회원탈퇴를 하시겠습니까?\n이 작업은 되돌릴 수 없습니다.')) {
      // 회원 탈퇴 로직 구현 필요
      alert('회원탈퇴 기능은 추후 구현될 예정입니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-lg font-medium text-black">설정</h2>
          <button 
            onClick={onClose}
            className="p-1"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-1">
          {/* 서비스 이용약관 */}
          <button
            onClick={handleServiceTerms}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-lg">📄</span>
              </div>
              <span className="text-gray-700">서비스 이용약관</span>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </button>

          {/* 개인정보 처리방침 */}
          <button
            onClick={handlePrivacyPolicy}
            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-lg"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-lg">🔒</span>
              </div>
              <span className="text-gray-700">개인정보 처리방침</span>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </button>

          {/* 로그아웃 (로그인된 경우에만 표시) */}
          {isLoggedIn && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center p-4 hover:bg-gray-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">🚪</span>
                </div>
                <span className="text-gray-700">로그아웃</span>
              </div>
            </button>
          )}

          {/* 회원 탈퇴 (로그인된 경우에만 표시) */}
          {isLoggedIn && (
            <button
              onClick={handleDeleteAccount}
              className="w-full flex items-center p-4 hover:bg-red-50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-lg">⚠️</span>
                </div>
                <span className="text-red-500">회원 탈퇴</span>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings; 