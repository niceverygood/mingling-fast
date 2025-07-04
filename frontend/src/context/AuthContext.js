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
    // WebView 환경에서 redirect 결과 처리
    const checkRedirectResult = async () => {
      try {
        const isWebView = window.ReactNativeWebView !== undefined || 
                         navigator.userAgent.includes('WebView') ||
                         navigator.userAgent.includes('wv');
        
        if (isWebView) {
          console.log('WebView 환경에서 redirect 결과 확인 중...');
          const result = await handleRedirectResult();
          if (result.success && result.user) {
            console.log('Redirect 로그인 성공:', result.user);
            setIsLoggedIn(true);
            setUser(result.user);
            // Firebase 사용자 ID를 axios 헤더에 설정
            axios.defaults.headers.common['X-User-ID'] = result.user.uid;
            axios.defaults.headers.common['X-User-Email'] = result.user.email;
          }
        }
      } catch (error) {
        console.error('Redirect 결과 처리 오류:', error);
      }
    };

    checkRedirectResult();

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setIsLoggedIn(true);
        setUser({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          provider: 'google'
        });
        // Firebase 사용자 ID를 axios 헤더에 설정
        axios.defaults.headers.common['X-User-ID'] = firebaseUser.uid;
        axios.defaults.headers.common['X-User-Email'] = firebaseUser.email;
      } else {
        setIsLoggedIn(false);
        setUser(null);
        // 로그아웃 시 헤더 제거
        delete axios.defaults.headers.common['X-User-ID'];
        delete axios.defaults.headers.common['X-User-Email'];
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
      const result = await signOutUser();
      if (result.success) {
        setIsLoggedIn(false);
        setUser(null);
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
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