import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose }) => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        onClose();
      } else {
        setError(result.error || 'Google 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('로그인 중 오류가 발생했습니다.');
    }
    
    setLoading(false);
  };

  const handleGuestLogin = () => {
    // 게스트 사용자가 "계속하기"를 선택하면 모달만 닫기
    // 30분 동안 인터셉터 비활성화
    const skipUntil = Date.now() + (30 * 60 * 1000); // 30분
    localStorage.setItem('skipGuestInterceptor', skipUntil.toString());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-header">
          <h2>💫 로그인이 필요해요</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="login-modal-content">
          <p>더 많은 기능을 사용하려면 로그인해주세요!</p>
          
          {error && (
            <div className="error-message">
              {error}
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
            
                         <button 
               onClick={handleGuestLogin}
               className="guest-login-btn"
             >
               ⏱️ 30분간 알림 끄기
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 