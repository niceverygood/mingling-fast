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

    const handleClick = (event) => {
      // 로그인 모달이 이미 열려있으면 무시
      if (showLoginModal) return;

      const target = event.target;
      
      // 로그인 모달 내부 클릭은 무시
      if (target.closest('.login-modal')) return;
      
      // 로그인 모달 오버레이 클릭은 무시 (모달 닫기 허용)
      if (target.closest('.login-modal-overlay')) return;

      // 클릭한 요소가 버튼, 링크, 또는 클릭 가능한 요소인지 확인
      const clickableElement = target.closest('button, a, [onclick], .clickable, [role="button"], input[type="submit"], input[type="button"]');
      
      // 클릭 가능한 요소가 아니면 무시
      if (!clickableElement) return;

      // 특정 요소들만 제외 (최소한으로 축소)
      const excludeSelectors = [
        '.close-button', // 모달 닫기 버튼
        '.login-modal-close' // 로그인 모달 닫기 버튼
      ];

      if (excludeSelectors.some(selector => target.closest(selector))) {
        return;
      }

      // 이벤트 중단 및 로그인 모달 표시
      event.preventDefault();
      event.stopPropagation();
      setShowLoginModal(true);
      
      console.log('🚫 게스트 사용자 버튼 클릭 인터셉트됨:', {
        element: clickableElement.tagName,
        text: clickableElement.textContent?.trim().substring(0, 50),
        id: clickableElement.id,
        className: clickableElement.className
      });
    };

    // 전역 클릭 이벤트 리스너 추가 (캡처 단계에서 처리)
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('click', handleClick, true);
    };
  }, [isLoggedIn, user, showLoginModal, isWebView]);

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  // 게스트 사용자 상태 디버그 정보
  useEffect(() => {
    if (user && user.provider === 'guest') {
      console.log('👤 게스트 인터셉터 활성화됨:', {
        isLoggedIn,
        userProvider: user.provider,
        userId: user.uid,
        isWebView
      });
    }
  }, [user, isLoggedIn, isWebView]);

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