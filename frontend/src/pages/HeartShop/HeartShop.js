import React, { useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import PaymentService from '../../services/payment';

const HeartShop = ({ onClose, currentHearts, onPurchase }) => {
  const [selectedPack, setSelectedPack] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  console.log('💖 HeartShop 컴포넌트 렌더링:', { currentHearts, onPurchase: !!onPurchase });

  // API URL 설정 (Cloudflare HTTPS 사용)
  const API_BASE_URL = process.env.NODE_ENV === 'production' 
    ? 'https://api.minglingchat.com' 
    : 'http://localhost:8001';

  // PaymentService 인스턴스 생성 (lazy)
  const getPaymentService = () => {
    if (!window.paymentServiceInstance) {
      window.paymentServiceInstance = new PaymentService();
    }
    return window.paymentServiceInstance;
  };

  const heartPacks = [
    {
      id: 'basic',
      name: '기본 팩',
      hearts: 50,
      price: 1000,
      originalPrice: null,
      discount: null,
      popular: false,
      icon: '💖'
    },
    {
      id: 'popular',
      name: '인기 팩',
      hearts: 120,
      price: 2000,
      originalPrice: 2400,
      discount: null,
      popular: true,
      icon: '⭐'
    },
    {
      id: 'bulk',
      name: '대용량 팩',
      hearts: 300,
      price: 4500,
      originalPrice: 6000,
      discount: '25% 할인',
      popular: false,
      icon: '⚡'
    },
    {
      id: 'premium',
      name: '프리미엄 팩',
      hearts: 500,
      price: 7000,
      originalPrice: 10000,
      discount: '30% 할인',
      popular: false,
      icon: '👑'
    }
  ];

  const handlePurchase = async (pack) => {
    console.log('🛒 하트 구매 시작 (KG이니시스 방식):', pack);
    
    if (isProcessing) {
      console.log('⏳ 이미 처리 중인 결제 있음');
      return;
    }
    
    setSelectedPack(pack);
    setIsProcessing(true);
    setProcessingMessage('결제 준비 중...');

    try {
      // 포트원 SDK 초기화 확인
      if (!window.IMP) {
        console.log('📦 포트원 SDK 로딩 중...');
        await loadPortoneSDK();
      }

      // 사용자 정보 수집
      console.log('👤 사용자 정보 수집 중...');
      let userEmail = localStorage.getItem('userEmail') || 'user@minglingchat.com';
      let userId = localStorage.getItem('userId') || 'guest';
      
      // authData에서도 확인
      try {
        const authData = JSON.parse(localStorage.getItem('authData') || '{}');
        if (authData.email && (!userEmail || userEmail === 'user@minglingchat.com')) {
          userEmail = authData.email;
        }
        if (authData.userId && (!userId || userId === 'guest')) {
          userId = authData.userId;
        }
      } catch (error) {
        console.warn('⚠️ authData 파싱 실패:', error);
      }
      
      console.log('✅ 사용자 정보 확인 완료:', { userEmail, userId });
      
      // 결제 요청 (성공 코드 방식)
      setProcessingMessage('결제 진행 중...');
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 8);
      const orderId = `HEART-${userId}-${pack.id}-${timestamp}-${randomId}`;

      console.log('💳 포트원 결제 요청 시작');
      const paymentResult = await new Promise((resolve, reject) => {
        window.IMP.request_pay({
          pg: 'html5_inicis.MOIplay998', // KG이니시스
          pay_method: 'card',
          merchant_uid: orderId,
          name: `${pack.hearts}개 하트`,
          amount: pack.price,
          buyer_email: userEmail,
          buyer_name: userEmail.split('@')[0],
          buyer_tel: '010-0000-0000',
          m_redirect_url: `${window.location.origin}/payment/complete`,
        }, (rsp) => {
          console.log('📨 포트원 결제 응답:', rsp);
          
          if (rsp.success) {
            console.log('✅ 결제 성공:', rsp.imp_uid);
            resolve(rsp);
          } else {
            console.error('❌ 결제 실패:', rsp.error_msg);
            reject(new Error(rsp.error_msg || '결제가 취소되었습니다.'));
          }
        });
      });

      console.log('✅ 결제 완료:', paymentResult);

      // 서버에 하트 충전 요청 (성공 코드 방식)
      setProcessingMessage('하트 충전 중...');
      console.log('🔍 서버에 하트 충전 요청');
      
      const chargeResponse = await fetch(`${API_BASE_URL}/api/payment/charge-hearts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          'X-User-Email': userEmail
        },
        body: JSON.stringify({
          imp_uid: paymentResult.imp_uid,
          merchant_uid: paymentResult.merchant_uid,
          package_id: pack.id,
          heart_amount: pack.hearts,
          paid_amount: pack.price
        })
      });

      const chargeData = await chargeResponse.json();
      console.log('📨 하트 충전 응답:', chargeData);

      if (!chargeResponse.ok || !chargeData.success) {
        throw new Error(chargeData.error || '하트 충전에 실패했습니다.');
      }

      console.log('✅ 하트 충전 완료');
      
      // 성공 처리
      console.log('🎉 전체 구매 과정 완료');
      if (onPurchase) {
        console.log('📢 부모 컴포넌트에 구매 완료 알림');
        onPurchase({
          ...pack,
          success: true,
          newHeartBalance: chargeData.newBalance
        });
      }
      
      alert(`🎉 ${pack.hearts}개 하트 구매 완료!\n하트가 즉시 지급되었습니다.\n새 잔액: ${chargeData.newBalance}개`);
      
      // 성공 후 창 닫기
      onClose();
        
    } catch (error) {
      console.error('❌ 결제 과정 중 오류 발생:', error);
      
      let errorMessage = '결제 중 오류가 발생했습니다.';
      
      if (error.message) {
        errorMessage = error.message;
      }
      
      // 사용자에게 더 친숙한 메시지 제공
      if (errorMessage.includes('등록된 PG')) {
        errorMessage = '결제 시스템 설정에 문제가 있습니다.\n잠시 후 다시 시도해주세요.';
      } else if (errorMessage.includes('취소')) {
        errorMessage = '결제가 취소되었습니다.';
      } else if (errorMessage.includes('SDK')) {
        errorMessage = '결제 시스템 로딩에 실패했습니다.\n페이지를 새로고침 후 다시 시도해주세요.';
      }
      
      console.log('📢 사용자에게 표시할 에러 메시지:', errorMessage);
      alert(`❌ 결제 실패\n${errorMessage}`);
    } finally {
      console.log('🔄 결제 과정 정리');
      setIsProcessing(false);
      setProcessingMessage('');
      setSelectedPack(null);
    }
  };

  // 포트원 SDK 로딩 함수
  const loadPortoneSDK = () => {
    return new Promise((resolve, reject) => {
      if (window.IMP) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://cdn.iamport.kr/js/iamport.payment-1.2.0.js';
      script.async = true;
      
      script.onload = () => {
        setTimeout(() => {
          if (window.IMP) {
            try {
              window.IMP.init('imp20122888'); // 고객사 식별코드
              console.log('✅ 포트원 SDK 초기화 완료');
              resolve();
            } catch (error) {
              console.error('❌ 포트원 SDK 초기화 실패:', error);
              reject(error);
            }
          } else {
            reject(new Error('포트원 SDK 로드 실패'));
          }
        }, 500);
      };
      
      script.onerror = () => {
        reject(new Error('포트원 SDK 스크립트 로드 실패'));
      };
      
      document.head.appendChild(script);
    });
  };

  // 사용자 하트 잔액 새로고침 함수 (EC2 서버)
  const refreshHeartBalance = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'guest';
      const userEmail = localStorage.getItem('userEmail') || 'user@minglingchat.com';
      
      console.log('🔄 하트 잔액 새로고침 중...', { userId, userEmail, apiUrl: API_BASE_URL });
      
      const response = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': userId,
          'X-User-Email': userEmail
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        console.log('✅ 사용자 정보 새로고침 완료:', userData);
        return userData.hearts || 0;
      } else {
        console.warn('⚠️ 사용자 정보 조회 실패:', response.status);
        return null;
      }
    } catch (error) {
      console.error('❌ 하트 잔액 새로고침 실패:', error);
      return null;
    }
  };

  const formatPrice = (price) => {
    return `₩${price.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-sm mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <button 
            onClick={onClose}
            className="p-2 -ml-2"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-medium text-black">하트샵</h1>
          <div className="flex items-center space-x-1">
            <HeartSolid className="w-5 h-5 text-pink-500" />
            <span className="text-pink-500 font-medium">{currentHearts}</span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 pb-32">
          {/* Header Message */}
          <div className="text-center text-sm text-gray-500">
            AI와 더 많은 대화를 나눠보세요
          </div>

          {/* Heart Introduction */}
          <div className="bg-pink-50 rounded-2xl p-6 text-center">
            <HeartSolid className="w-12 h-12 text-pink-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-black mb-2">
              하트로 AI와 대화하세요
            </h2>
            <p className="text-sm text-gray-600 mb-1">
              메시지 하나당 하트 1개가 소모됩니다
            </p>
            <p className="text-sm text-gray-600">
              더 많은 하트로 무제한 대화를 즐겨보세요!
            </p>
          </div>

          {/* Payment System Status */}
          <div className="bg-green-50 rounded-2xl p-4 border border-green-200">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-green-500 text-lg">✅</span>
              <h3 className="text-sm font-medium text-green-800">즉시 하트 지급</h3>
            </div>
            <p className="text-xs text-green-700">
              결제 완료 즉시 하트가 지급됩니다. 웹훅 대기 없이 바로 사용 가능합니다.
            </p>
          </div>

          {/* Heart Packs */}
          <div className="space-y-3">
            {heartPacks.map((pack) => (
              <div 
                key={pack.id}
                className={`relative bg-white border-2 rounded-2xl p-4 ${
                  pack.popular 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                {pack.popular && (
                  <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                      인기
                    </span>
                  </div>
                )}
                
                {pack.discount && (
                  <div className="absolute -top-2 right-4">
                    <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                      {pack.discount}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      pack.id === 'basic' ? 'bg-pink-100' :
                      pack.id === 'popular' ? 'bg-blue-100' :
                      pack.id === 'bulk' ? 'bg-purple-100' :
                      'bg-yellow-100'
                    }`}>
                      <span className="text-xl">{pack.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-black">{pack.name}</h3>
                      <div className="flex items-center space-x-1">
                        <HeartSolid className="w-4 h-4 text-pink-500" />
                        <span className="text-pink-500 font-medium">{pack.hearts}개</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    {pack.originalPrice && (
                      <div className="text-xs text-gray-400 line-through">
                        {formatPrice(pack.originalPrice)}
                      </div>
                    )}
                    <div className="text-lg font-bold text-black">
                      {formatPrice(pack.price)}
                    </div>
                    <button 
                      onClick={() => handlePurchase(pack)}
                      disabled={isProcessing}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        isProcessing 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : pack.popular 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'bg-black text-white hover:bg-gray-800'
                      }`}
                    >
                      {isProcessing && selectedPack?.id === pack.id 
                        ? '처리중...' 
                        : '구매하기'
                      }
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Purchase Info */}
          <div className="bg-gray-50 rounded-2xl p-4">
            <h3 className="font-medium text-black mb-3">구매 안내</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start space-x-2">
                <span className="text-gray-400">•</span>
                <span>하트는 결제 완료 즉시 계정에 추가됩니다</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-gray-400">•</span>
                <span>하트는 만료되지 않으며 계정에 영구 보관됩니다</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-gray-400">•</span>
                <span>구매한 하트는 환불이 불가능합니다</span>
              </div>
              <div className="flex items-start space-x-2">
                <span className="text-gray-400">•</span>
                <span>문의사항은 고객센터로 연락해주세요</span>
              </div>
            </div>
          </div>
        </div>

        {/* Processing Overlay */}
        {isProcessing && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl p-6 mx-4 max-w-sm w-full text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto mb-4"></div>
              <h3 className="text-lg font-medium text-black mb-2">결제 진행 중</h3>
              <p className="text-sm text-gray-600">{processingMessage}</p>
              <div className="mt-3 text-xs text-gray-500">
                <div>✅ 결제 완료 즉시 하트 지급</div>
                <div>⏳ 잠시만 기다려주세요...</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeartShop; 