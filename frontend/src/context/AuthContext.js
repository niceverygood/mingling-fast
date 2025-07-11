import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, signInWithGoogle, signOutUser, handleRedirectResult } from '../firebase/config';
import axios from 'axios';

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

  useEffect(() => {
    // 개발 환경에서 즉시 임시 로그인
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
        
        // Firebase 사용자 ID를 axios 헤더에 설정
        axios.defaults.headers.common['X-User-ID'] = realUser.uid;
        axios.defaults.headers.common['X-User-Email'] = realUser.email;
        
        return;
      }
      
      // 실제 사용자 정보가 없으면 임시 사용자 사용
      const tempUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User',
        photoURL: null,
        provider: 'temp'
      };
      
      console.log('🔧 Development mode: Auto-login with temp user');
      setIsLoggedIn(true);
      setUser(tempUser);
      setLoading(false);
      
      // Firebase 사용자 ID를 axios 헤더에 설정
      axios.defaults.headers.common['X-User-ID'] = tempUser.uid;
      axios.defaults.headers.common['X-User-Email'] = tempUser.email;
      
      return; // 개발 환경에서는 Firebase 인증 건너뛰기
    }

    // 프로덕션 환경에서 게스트 모드 처리
    const handleGuestMode = () => {
      // localStorage에서 기존 게스트 사용자 확인
      let guestUserId = localStorage.getItem('guestUserId');
      let guestUserEmail = localStorage.getItem('guestUserEmail');
      
      if (!guestUserId) {
        // 새 게스트 사용자 생성
        guestUserId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        guestUserEmail = `${guestUserId}@guest.minglingchat.com`;
        
        localStorage.setItem('guestUserId', guestUserId);
        localStorage.setItem('guestUserEmail', guestUserEmail);
        localStorage.setItem('userType', 'guest');
      }
      
      const guestUser = {
        uid: guestUserId,
        email: guestUserEmail,
        displayName: '게스트 사용자',
        photoURL: null,
        provider: 'guest'
      };
      
      console.log('👤 게스트 모드 활성화:', guestUser);
      setIsLoggedIn(true);
      setUser(guestUser);
      
      // axios 헤더 설정
      axios.defaults.headers.common['X-User-ID'] = guestUser.uid;
      axios.defaults.headers.common['X-User-Email'] = guestUser.email;
      
      return guestUser;
    };

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
            // Firebase 사용자 ID를 axios 헤더에 설정
            axios.defaults.headers.common['X-User-ID'] = result.user.uid;
            axios.defaults.headers.common['X-User-Email'] = result.user.email;
          } else if (result.error) {
            console.error('❌ Redirect 로그인 실패:', result.error);
            // WebView에서 로그인 실패 시 게스트 모드
            handleGuestMode();
          }
        }
      } catch (error) {
        console.error('💥 Redirect 결과 처리 오류:', error);
        // 에러 시 게스트 모드
        handleGuestMode();
      }
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
        
        // localStorage에 사용자 정보 저장
        localStorage.setItem('userEmail', firebaseUser.email);
        localStorage.setItem('userId', firebaseUser.uid);
        localStorage.setItem('userName', firebaseUser.displayName || firebaseUser.email.split('@')[0]);
        localStorage.setItem('userType', 'google');
        
        console.log('💾 사용자 정보 localStorage에 저장:', {
          email: firebaseUser.email,
          uid: firebaseUser.uid,
          displayName: firebaseUser.displayName
        });
        
        setIsLoggedIn(true);
        setUser(userData);
        
        // Firebase 사용자 ID를 axios 헤더에 설정
        axios.defaults.headers.common['X-User-ID'] = firebaseUser.uid;
        axios.defaults.headers.common['X-User-Email'] = firebaseUser.email;
      } else {
        // Firebase 로그인이 없으면 게스트 모드 활성화
        console.log('🚫 Firebase 로그인 없음 - 게스트 모드 활성화');
        handleGuestMode();
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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

  const logout = async () => {
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
      
      // axios 헤더 제거
      delete axios.defaults.headers.common['X-User-ID'];
      delete axios.defaults.headers.common['X-User-Email'];
      
      // 새로운 게스트 사용자 생성
      const newGuestUserId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newGuestUserEmail = `${newGuestUserId}@guest.minglingchat.com`;
      
      localStorage.setItem('guestUserId', newGuestUserId);
      localStorage.setItem('guestUserEmail', newGuestUserEmail);
      localStorage.setItem('userType', 'guest');
      
      const newGuestUser = {
        uid: newGuestUserId,
        email: newGuestUserEmail,
        displayName: '게스트 사용자',
        photoURL: null,
        provider: 'guest'
      };
      
      console.log('🔄 로그아웃 후 새 게스트 모드:', newGuestUser);
      
      // 새 게스트 사용자로 설정
      setIsLoggedIn(true);
      setUser(newGuestUser);
      
      // axios 헤더 재설정
      axios.defaults.headers.common['X-User-ID'] = newGuestUser.uid;
      axios.defaults.headers.common['X-User-Email'] = newGuestUser.email;
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  };

  // 임시 로그인 (Apple 등 다른 방식용)
  const login = (userData) => {
    setIsLoggedIn(true);
    setUser(userData);
  };

  const value = {
    isLoggedIn,
    user,
    loading,
    loginWithGoogle,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 