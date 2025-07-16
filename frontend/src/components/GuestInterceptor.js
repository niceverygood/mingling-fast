import React, { useEffect, useState, useCallback } from 'react';
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

  // 게스트 사용자인지 확인하는 함수
  const isGuestUser = useCallback(() => {
    if (!isLoggedIn || !user) return false;
    
    // 여러 방법으로 게스트 사용자 확인
    const isGuest = (
      user.provider === 'guest' ||
      user.uid?.startsWith('guest-') ||
      user.email?.includes('@guest.minglingchat.com') ||
      localStorage.getItem('userType') === 'guest'
    );
    
    return isGuest;
  }, [isLoggedIn, user]);

  useEffect(() => {
    // 웹 브라우저 환경에서만 게스트 인터셉터 작동
    if (isWebView) {
      console.log('🌐 WebView 환경에서는 게스트 인터셉터 비활성화');
      return;
    }
    
    // 게스트 사용자가 아니면 인터셉터 비활성화
    if (!isGuestUser()) {
      console.log('👤 게스트 사용자가 아니므로 인터셉터 비활성화', {
        isLoggedIn,
        user: user ? {
          uid: user.uid,
          provider: user.provider,
          email: user.email
        } : null,
        localStorage: localStorage.getItem('userType')
      });
      return;
    }

    console.log('🚫 게스트 인터셉터 활성화됨!', {
      user: {
        uid: user.uid,
        provider: user.provider,
        email: user.email
      },
      localStorage: localStorage.getItem('userType')
    });

    const handleClick = (event) => {
      // 로그인 모달이 이미 열려있으면 무시
      if (showLoginModal) return;

      const target = event.target;
      
      // 로그인 모달 내부 클릭은 무시
      if (target.closest('.login-modal')) return;
      
      // 로그인 모달 오버레이 클릭은 무시 (모달 닫기 허용)
      if (target.closest('.login-modal-overlay')) return;

      // 하단 네비게이션 버튼은 허용
      if (target.closest('.bottom-navigation') || 
          target.closest('[data-navigation="true"]') ||
          target.closest('nav')) {
        console.log('📱 하단 네비게이션 클릭 허용');
        return;
      }

      // 클릭한 요소가 버튼, 링크, 또는 클릭 가능한 요소인지 확인
      const clickableElement = target.closest('button, a, [onclick], .clickable, [role="button"], input[type="submit"], input[type="button"], .cursor-pointer');
      
      // 클릭 가능한 요소가 아니면 무시
      if (!clickableElement) return;

      // 특정 요소들만 제외 (최소한으로 축소)
      const excludeSelectors = [
        '.close-button', // 모달 닫기 버튼
        '.login-modal-close', // 로그인 모달 닫기 버튼
        '.bottom-navigation', // 하단 네비게이션
        '[data-navigation="true"]', // 네비게이션 데이터 속성
        'nav', // nav 태그
        '.navigation' // 네비게이션 클래스
      ];

      if (excludeSelectors.some(selector => target.closest(selector))) {
        console.log('✅ 제외된 요소 클릭 - 허용됨');
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
  }, [isLoggedIn, user, showLoginModal, isWebView, isGuestUser]);

  const handleCloseModal = () => {
    setShowLoginModal(false);
  };

  return (
    <>
      {children}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={handleCloseModal} 
        title="🔐 로그인이 필요한 기능이에요"
        subtitle="구글로 간편하게 로그인하세요"
      />
    </>
  );
};

export default GuestInterceptor; 