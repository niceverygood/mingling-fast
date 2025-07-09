import React, { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const LoginModal = ({ isOpen, onClose, title, subtitle }) => {
  const { loginWithGoogle, login } = useAuth();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await loginWithGoogle();
      if (result.success) {
        onClose();
      } else {
        alert('Google 로그인에 실패했습니다: ' + result.error);
      }
    } catch (error) {
      console.error('Google login error:', error);
      alert('Google 로그인 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = () => {
    // Apple 로그인 로직 (임시로 성공 처리)
    login({
      id: 'apple-user',
      name: '게스트',
      email: 'guest@example.com',
      provider: 'apple'
    });
    onClose();
  };

  const handleGuestContinue = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-center">{title}</h2>
            {subtitle && (
              <p className="text-sm text-gray-600 text-center mt-1">{subtitle}</p>
            )}
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Login Options */}
        <div className="p-6 space-y-3">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-gray-700">로그인 중...</span>
              </div>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="text-gray-700">Google로 로그인</span>
              </>
            )}
          </button>

          {/* Apple Login */}
          <button
            onClick={handleAppleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center px-4 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
            </svg>
            <span>Apple로 로그인</span>
          </button>

          {/* Terms */}
          <p className="text-xs text-gray-500 text-center mt-4 leading-relaxed">
            로그인 시 <span 
              onClick={() => navigate('/terms-of-service')}
              className="underline cursor-pointer hover:text-gray-700"
            >
              서비스 이용약관
            </span> 및 <span 
              onClick={() => navigate('/privacy-policy')}
              className="underline cursor-pointer hover:text-gray-700"
            >
              개인정보취급방침
            </span>에 동의한 것으로 간주됩니다.
          </p>

          {/* Guest Continue */}
          <button
            onClick={handleGuestContinue}
            disabled={loading}
            className="w-full text-center text-gray-500 text-sm mt-6 hover:text-gray-700 disabled:opacity-50"
          >
            게스트로 계속 둘러보기
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 