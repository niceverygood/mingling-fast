import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, handleRedirectResult } from '../firebase/config';
import axios from 'axios';
import appBridge from '../utils/appBridge';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false); // 로그인 모달 상태

  // 사용자 정보를 localStorage와 axios 헤더에 동기화하는 함수
  const syncUserToStorage = useCallback((userData) => {
    if (userData) {
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userId', userData.uid);
      localStorage.setItem('userName', userData.displayName || userData.email.split('@')[0]);
      localStorage.setItem('userType', userData.provider || 'guest');
      
      // axios 헤더에 즉시 설정
      axios.defaults.headers.common['X-User-ID'] = userData.uid;
      axios.defaults.headers.common['X-User-Email'] = userData.email;
      
      // 앱 브릿지가 활성화된 경우 토큰을 앱으로 전달
      if (appBridge.isAppEnvironment()) {
        // 간단한 토큰 생성 (실제로는 서버에서 JWT 토큰을 받아야 함)
        const token = btoa(JSON.stringify({
          uid: userData.uid,
          email: userData.email,
          displayName: userData.displayName,
          provider: userData.provider,
          timestamp: Date.now()
        }));
        
        // 토큰을 로컬 스토리지에 저장
        localStorage.setItem('userToken', token);
        
        // 앱으로 로그인 성공 알림
        appBridge.sendLoginSuccess(token);
      }
      
      console.log('💾 사용자 정보 동기화 완료:', {
        email: userData.email,
        uid: userData.uid,
        displayName: userData.displayName,
        provider: userData.provider,
        isApp: appBridge.isAppEnvironment()
      });
    }
  }, []);

  // 게스트 모드 처리 함수 개선
  const handleGuestMode = useCallback(() => {
    // 기존 게스트 사용자 확인
    let guestUserId = localStorage.getItem('guestUserId');
    let guestUserEmail = localStorage.getItem('guestUserEmail');
    
    if (!guestUserId) {
      // 새 게스트 사용자 생성
      guestUserId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      guestUserEmail = `${guestUserId}@guest.minglingchat.com`;
    }
    
    const guestUser = {
      uid: guestUserId,
      email: guestUserEmail,
      displayName: '게스트 사용자',
      photoURL: null,
      provider: 'guest'
    };
    
    // localStorage와 axios 헤더 동기화
    syncUserToStorage(guestUser);
    localStorage.setItem('guestUserId', guestUserId);
    localStorage.setItem('guestUserEmail', guestUserEmail);
    
    console.log('👤 게스트 모드 활성화:', guestUser);
    setIsLoggedIn(true);
    setUser(guestUser);
    
    return guestUser;
  }, [syncUserToStorage]);

  useEffect(() => {
    // 개발 환경에서 즉시 임시 로그인 (개선)
    if (process.env.NODE_ENV === 'development') {
      // 실제 로그인 사용자 정보가 localStorage에 있는지 확인
      const storedUserEmail = localStorage.getItem('userEmail');
      const storedUserId = localStorage.getItem('userId');
      
      if (storedUserEmail && storedUserId) {
        // 실제 로그인한 사용자 정보 사용
        const realUser = {
          uid: storedUserId,
          email: storedUserEmail,
          displayName: storedUserEmail.split('@')[0],
          photoURL: null,
          provider: 'real'
        };
        
        console.log('🔧 Development mode: Using real user from localStorage', realUser);
        setIsLoggedIn(true);
        setUser(realUser);
        setLoading(false);
        
        // axios 헤더 동기화
        syncUserToStorage(realUser);
        
        return;
      }
      
      // 실제 사용자 정보가 없으면 게스트 모드 사용
      console.log('🔧 Development mode: Using guest mode');
      handleGuestMode();
      setLoading(false);
      
      return; // 개발 환경에서는 Firebase 인증 건너뛰기
    }

    // WebView 환경에서 redirect 결과 처리
    const checkRedirectResult = async () => {
      try {
        const isWebView = window.ReactNativeWebView !== undefined || 
                         navigator.userAgent.includes('WebView') ||
                         navigator.userAgent.includes('wv') ||
                         navigator.userAgent.includes('MinglingAppExpo');
        
        console.log('🔍 환경 감지:', {
          isWebView,
          userAgent: navigator.userAgent,
          hasReactNativeWebView: window.ReactNativeWebView !== undefined,
          currentURL: window.location.href
        });
        
        if (isWebView) {
          console.log('📱 WebView 환경에서 redirect 결과 확인 중...');
          const result = await handleRedirectResult();
          console.log('🔄 Redirect 결과:', result);
          
          if (result.success && result.user) {
            console.log('✅ Redirect 로그인 성공:', result.user);
            setIsLoggedIn(true);
            setUser(result.user);
            syncUserToStorage(result.user);
            return;
          } else if (result.error) {
            console.error('❌ Redirect 로그인 실패:', result.error);
          }
        }
      } catch (error) {
        console.error('💥 Redirect 결과 처리 오류:', error);
      }
      
      // WebView에서 로그인 실패 시 또는 일반 브라우저에서 게스트 모드
      handleGuestMode();
    };

    checkRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          provider: 'google'
        };
        
        console.log('🔥 Firebase 인증 성공:', userData);
        setIsLoggedIn(true);
        setUser(userData);
        syncUserToStorage(userData);
      } else {
        // Firebase 로그인이 없으면 게스트 모드 활성화
        console.log('🚫 Firebase 로그인 없음 - 게스트 모드 활성화');
        handleGuestMode();
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [handleGuestMode, syncUserToStorage]);

  useEffect(() => {
    // 전역 인증 오류 이벤트 리스너 추가
    const handleAuthRequired = (event) => {
      console.log('🔐 전역 인증 오류 감지:', event.detail);
      
      // 이미 로그인되어 있다면 토큰 만료로 간주하고 로그아웃 처리
      if (isLoggedIn) {
        console.log('🔄 토큰 만료로 인한 자동 로그아웃');
        // logout 함수 직접 호출 대신 로그아웃 로직을 여기에 구현
        localStorage.removeItem('userEmail');
        localStorage.removeItem('userId');
        localStorage.removeItem('userName');
        localStorage.removeItem('userType');
        localStorage.removeItem('guestUserId');
        localStorage.removeItem('guestUserEmail');
        localStorage.removeItem('userToken');
        
        // 새로운 게스트 사용자 생성
        handleGuestMode();
      }
      
      // 로그인 모달 표시
      setShowLoginModal(true);
      
      // 사용자에게 알림
      if (event.detail?.reason) {
        // 토스트 알림이나 다른 알림 방식으로 표시할 수 있음
        console.log('📢 인증 오류:', event.detail.reason);
      }
    };
    
    // 하트 잔액 변경 이벤트 리스너 추가
    const handleHeartBalanceChanged = (event) => {
      console.log('💖 하트 잔액 변경 감지:', event.detail);
      
      // 사용자 정보 업데이트 (하트 잔액이 포함된 경우)
      if (user && event.detail?.newBalance !== undefined) {
        setUser(prevUser => ({
          ...prevUser,
          hearts: event.detail.newBalance
        }));
      }
    };
    
    window.addEventListener('auth:loginRequired', handleAuthRequired);
    window.addEventListener('hearts:balanceChanged', handleHeartBalanceChanged);
    
    return () => {
      window.removeEventListener('auth:loginRequired', handleAuthRequired);
      window.removeEventListener('hearts:balanceChanged', handleHeartBalanceChanged);
    };
  }, [isLoggedIn, user, handleGuestMode]); // handleGuestMode를 의존성에 추가

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithGoogle();
      if (result.success) {
        if (result.redirected) {
          // WebView에서 redirect가 시작됨
          console.log('Google 로그인 redirect 시작됨');
          return { success: true, redirected: true };
        } else {
          // 일반 브라우저에서 popup 로그인 성공
          setIsLoggedIn(true);
          setUser(result.user);
          syncUserToStorage(result.user);
          return { success: true };
        }
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = useCallback(async () => {
    try {
      const userType = localStorage.getItem('userType');
      
      if (userType === 'google') {
        // Google 사용자인 경우 Firebase 로그아웃
        const result = await signOutUser();
        if (!result.success) {
          return { success: false, error: result.error };
        }
      }
      
      // 모든 사용자 정보 제거
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userId');
      localStorage.removeItem('userName');
      localStorage.removeItem('userType');
      localStorage.removeItem('guestUserId');
      localStorage.removeItem('guestUserEmail');
      localStorage.removeItem('userToken');
      
      // axios 헤더 제거
      delete axios.defaults.headers.common['X-User-ID'];
      delete axios.defaults.headers.common['X-User-Email'];
      
      // 앱 브릿지가 활성화된 경우 로그아웃 알림
      if (appBridge.isAppEnvironment()) {
        appBridge.sendLogout();
      }
      
      // 새로운 게스트 사용자 생성
      const newGuestUser = handleGuestMode();
      
      console.log('🔄 로그아웃 후 새 게스트 모드:', newGuestUser);
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }, [handleGuestMode]);

  // 임시 로그인 (Apple 등 다른 방식용)
  const login = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
    syncUserToStorage(userData);
  };

  const value = {
    isLoggedIn,
    user,
    loading,
    loginWithGoogle,
    login,
    logout,
    showLoginModal, // 로그인 모달 상태 공유
    setShowLoginModal // 로그인 모달 상태 변경 함수 공유
  };

      return (
      <AuthContext.Provider value={value}>
        {children}
        
        {/* 전역 로그인 모달 */}
        {showLoginModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm mx-4 w-full">
              <h2 className="text-lg font-semibold mb-4 text-center">로그인이 필요합니다</h2>
              <p className="text-gray-600 mb-6 text-center">
                계속하려면 로그인해주세요.
              </p>
              
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    loginWithGoogle();
                  }}
                  className="w-full bg-black text-white py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                >
                  Google로 로그인
                </button>
                
                <button
                  onClick={() => setShowLoginModal(false)}
                  className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}
      </AuthContext.Provider>
    );
}; 