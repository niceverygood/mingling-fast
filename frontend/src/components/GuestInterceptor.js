import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import LoginModal from './LoginModal';

const GuestInterceptor = ({ children }) => {
  const { user, isLoggedIn } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  // WebView 환경 감지
  const isWebView = window.ReactNativeWebView !== undefined || 
                   navigator.userAgent.includes('WebView') ||
                   navigator.userAgent.includes('wv') ||
                   navigator.userAgent.includes('MinglingApp') ||
                   window.IS_NATIVE_APP === true;

  useEffect(() => {
    // 웹 브라우저 환경에서만 게스트 인터셉터 작동
    if (isWebView) return;
    
    // 게스트 사용자가 아니면 인터셉터 비활성화
    if (!isLoggedIn || !user || user.provider !== 'guest') return;

    // 사용자가 "계속하기"를 선택했는지 확인
    const skipUntil = localStorage.getItem('skipGuestInterceptor');
    if (skipUntil && Date.now() < parseInt(skipUntil)) {
      return; // 스킵 기간 동안 인터셉터 비활성화
    }

    const handleClick = (event) => {
      // 로그인 모달이 이미 열려있으면 무시
      if (showLoginModal) return;

      const target = event.target;
      const clickedElement = target.closest('button, a, .clickable');
      
      // 클릭한 요소가 버튼이거나 링크가 아니면 무시
      if (!clickedElement) return;

      // 로그인 모달 내부 클릭은 무시
      if (target.closest('.login-modal')) return;

      // 특정 요소들은 인터셉트하지 않음
      const excludeSelectors = [
        '.close-button',
        '.login-modal-overlay',
        '.bottom-nav',
        '.navbar',
        '.popup-overlay',
        '.no-intercept'
      ];

      if (excludeSelectors.some(selector => target.closest(selector))) {
        return;
      }

      // 이벤트 중단 및 로그인 모달 표시
      event.preventDefault();
      event.stopPropagation();
      setShowLoginModal(true);
    };

    // 전역 클릭 이벤트 리스너 추가
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [isLoggedIn, user, showLoginModal, isWebView]);

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  return (
    <>
      {children}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={handleCloseModal} 
      />
    </>
  );
};

export default GuestInterceptor; 