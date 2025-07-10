import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // WebView 환경 감지
  const isWebView = window.ReactNativeWebView !== undefined || 
                   navigator.userAgent.includes('WebView') ||
                   navigator.userAgent.includes('wv') ||
                   navigator.userAgent.includes('MinglingAppExpo');

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

  // WebView 환경에서 임시 로그인 기능
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

        {/* WebView 환경 알림 */}
        {isWebView && (
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
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="google-login-btn"
          >
            {loading ? '로그인 중...' : '🔍 Google로 로그인'}
          </button>

          {/* WebView 환경에서만 임시 로그인 버튼 표시 */}
          {isWebView && (
            <button 
              onClick={handleTempLogin}
              className="temp-login-btn"
            >
              ⚡ 체험용 로그인 (앱 전용)
            </button>
          )}
        </div>

        {isWebView && (
          <div className="webview-help">
            <h3>💡 앱에서 정식 로그인 방법</h3>
            <ol>
              <li>브라우저에서 <strong>minglingchat.com</strong> 접속</li>
              <li>Google 로그인 완료</li>
              <li>앱으로 돌아와서 새로고침</li>
            </ol>
            <p>또는 위의 "체험용 로그인"을 사용해보세요!</p>
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