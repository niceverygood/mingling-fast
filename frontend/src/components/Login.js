import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // WebView 환경 감지 (더 정확한 감지)
  const isWebView = window.ReactNativeWebView !== undefined || 
                   navigator.userAgent.includes('WebView') ||
                   navigator.userAgent.includes('wv') ||
                   navigator.userAgent.includes('MinglingApp') ||
                   window.IS_NATIVE_APP === true;

  // 네이티브 앱에서 전달받은 사용자 정보 확인
  useEffect(() => {
    if (window.NATIVE_USER_INFO) {
      console.log('🏠 네이티브 앱에서 사용자 정보 감지:', window.NATIVE_USER_INFO);
      handleNativeLogin(window.NATIVE_USER_INFO);
    }
  }, []);

  // 네이티브 앱 자동 로그인 처리
  const handleNativeLogin = (nativeUserInfo) => {
    try {
      const tempUser = {
        uid: nativeUserInfo.id,
        email: nativeUserInfo.email,
        displayName: nativeUserInfo.username,
        photoURL: null,
        provider: 'native',
        hearts: nativeUserInfo.hearts || 150,
        authToken: nativeUserInfo.authToken
      };
      
      // 사용자 정보를 저장하고 로그인 상태로 전환
      localStorage.setItem('userEmail', tempUser.email);
      localStorage.setItem('userId', tempUser.uid);
      localStorage.setItem('userName', tempUser.displayName);
      localStorage.setItem('userHearts', tempUser.hearts.toString());
      localStorage.setItem('authToken', tempUser.authToken);
      
      // AuthContext 업데이트
      if (window.auth && window.auth.setUser) {
        window.auth.setUser(tempUser);
      }
      
      // 페이지 새로고침하여 로그인 상태 반영
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('❌ 네이티브 로그인 처리 실패:', error);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loginWithGoogle();
      if (!result.success) {
        setError(result.error || 'Google 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('로그인 중 오류가 발생했습니다.');
    }
    
    setLoading(false);
  };

  // 네이티브 앱용 간편 로그인
  const handleNativeQuickLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 디바이스 ID 생성 (실제로는 더 안전한 방법 사용)
      const deviceId = localStorage.getItem('deviceId') || 
                      `app_${Math.random().toString(36).substr(2, 15)}_${Date.now()}`;
      
      if (!localStorage.getItem('deviceId')) {
        localStorage.setItem('deviceId', deviceId);
      }

      const response = await fetch('/api/auth/native-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deviceId: deviceId,
          email: `${deviceId}@app.mingling`,
          name: `앱사용자_${Date.now().toString().slice(-4)}`
        })
      });

      const data = await response.json();

      if (data.success) {
        const user = {
          uid: data.user.id,
          email: data.user.email,
          displayName: data.user.username,
          photoURL: null,
          provider: 'native',
          hearts: data.user.hearts,
          authToken: data.token
        };

        // 로그인 정보 저장
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userId', user.uid);
        localStorage.setItem('userName', user.displayName);
        localStorage.setItem('userHearts', user.hearts.toString());
        localStorage.setItem('authToken', user.authToken);

        // AuthContext 업데이트
        if (window.auth && window.auth.setUser) {
          window.auth.setUser(user);
        }

        // 페이지 새로고침
        window.location.reload();
      } else {
        setError(data.error || '앱 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 네이티브 빠른 로그인 실패:', error);
      setError('앱 로그인 중 오류가 발생했습니다.');
    }
    
    setLoading(false);
  };

  // WebView 환경에서 임시 로그인 기능 (기존 방식 유지)
  const handleTempLogin = () => {
    const tempUser = {
      uid: 'webview-user-' + Date.now(),
      email: 'webview@minglingchat.com',
      displayName: 'WebView User',
      photoURL: null,
      provider: 'temp'
    };
    
    // AuthContext의 login 함수 사용
    if (window.auth && window.auth.login) {
      window.auth.login(tempUser);
    } else {
      // localStorage에 임시 사용자 정보 저장
      localStorage.setItem('userEmail', tempUser.email);
      localStorage.setItem('userId', tempUser.uid);
      localStorage.setItem('userName', tempUser.displayName);
      
      // 페이지 새로고침으로 AuthContext가 다시 초기화되도록
      window.location.reload();
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>🌟 Mingling</h1>
          <p>AI 캐릭터와 대화를 시작해보세요</p>
        </div>

        {/* 네이티브 앱에서 자동 로그인 중인 경우 */}
        {window.NATIVE_USER_INFO && (
          <div className="native-login-notice">
            <p>📱 앱에서 자동 로그인 중...</p>
            <small>사용자: {window.NATIVE_USER_INFO.username}</small>
          </div>
        )}

        {/* WebView 환경 알림 */}
        {isWebView && !window.NATIVE_USER_INFO && (
          <div className="webview-notice">
            <p>📱 앱 환경에서 접속 중입니다</p>
            <small>Google 정책으로 인해 앱 내에서는 Google 로그인이 제한됩니다</small>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
            {isWebView && (
              <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
                💡 Google이 2021년부터 앱 내 브라우저에서 OAuth를 차단하고 있습니다.
              </div>
            )}
          </div>
        )}

        <div className="login-buttons">
          {/* 일반 Google 로그인 (웹 환경 또는 WebView에서도 시도 가능) */}
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="google-login-btn"
          >
            {loading ? '로그인 중...' : '🔍 Google로 로그인'}
          </button>

          {/* 네이티브 앱 환경에서만 앱 전용 로그인 버튼들 표시 */}
          {isWebView && (
            <>
              <button 
                onClick={handleNativeQuickLogin}
                disabled={loading}
                className="native-login-btn"
              >
                {loading ? '로그인 중...' : '🚀 앱 전용 빠른 로그인'}
              </button>
              
              <button 
                onClick={handleTempLogin}
                className="temp-login-btn"
              >
                ⚡ 체험용 로그인 (임시)
              </button>
            </>
          )}
        </div>

        {isWebView && (
          <div className="webview-help">
            <h3>💡 로그인 방법 안내</h3>
            
            <div className="login-method">
              <h4>🚀 추천: 앱 전용 빠른 로그인</h4>
              <p>디바이스 기반의 안전한 로그인으로 모든 기능을 사용할 수 있습니다.</p>
            </div>
            
            <div className="login-method">
              <h4>🌐 브라우저에서 Google 로그인</h4>
              <ol>
                <li>브라우저에서 <strong>minglingchat.com</strong> 접속</li>
                <li>Google 로그인 완료</li>
                <li>앱으로 돌아와서 새로고침</li>
              </ol>
            </div>
            
            <div className="login-method">
              <h4>⚡ 체험용 로그인</h4>
              <p>임시 계정으로 서비스를 먼저 체험해보세요.</p>
            </div>
          </div>
        )}

        <div className="login-footer">
          <small>로그인하면 <a href="/terms">이용약관</a> 및 <a href="/privacy">개인정보처리방침</a>에 동의하는 것으로 간주됩니다.</small>
        </div>
      </div>
    </div>
  );
};

export default Login; 