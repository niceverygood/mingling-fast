import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './LoginModal.css';

const LoginModal = ({ isOpen, onClose, title, subtitle }) => {
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

  if (!isOpen) return null;

  return (
    <div className="login-modal-overlay" onClick={onClose}>
      <div className="login-modal" onClick={(e) => e.stopPropagation()}>
        <div className="login-modal-header">
          <h2>{title || "🔐 로그인이 필요한 기능이에요"}</h2>
          <button className="close-button login-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="login-modal-content">
          <p>{subtitle || "이 기능을 사용하려면 Google 계정으로 로그인해주세요!"}</p>
          
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
            
            <p className="login-notice">
              로그인하면 채팅, 캐릭터 생성, 하트 충전 등<br/>
              모든 기능을 자유롭게 사용할 수 있어요!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 