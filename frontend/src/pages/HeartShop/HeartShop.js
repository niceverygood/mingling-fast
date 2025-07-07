import React, { useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import PaymentService from '../../services/payment';

const HeartShop = ({ onClose, currentHearts, onPurchase }) => {
  const [selectedPack, setSelectedPack] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  console.log('💖 HeartShop 컴포넌트 렌더링:', { currentHearts, onPurchase: !!onPurchase });

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
    console.log('🛒 하트 구매 시작:', pack);
    
    if (isProcessing) {
      console.log('⏳ 이미 처리 중인 결제 있음');
      return;
    }
    
    setSelectedPack(pack);
    setIsProcessing(true);
    setProcessingMessage('결제 준비 중...');

    try {
      // 사용자 정보 가져오기
      const userEmail = localStorage.getItem('userEmail') || 'user@minglingchat.com';
      const userId = localStorage.getItem('userId') || 'guest';
      
      console.log('👤 사용자 정보:', { userEmail, userId });
      
      const userInfo = {
        email: userEmail,
        name: userEmail.split('@')[0],
        userId: userId,
        phone: '010-0000-0000'
      };

      console.log('📋 결제 데이터 구성:', { pack, userInfo });
      setProcessingMessage('결제 진행 중...');
      
      // PaymentService를 통한 결제 요청
      console.log('💳 결제 요청 시작');
      const paymentService = getPaymentService();
      const paymentResult = await paymentService.purchaseHearts(pack.id, userInfo);
      console.log('💳 결제 결과:', paymentResult);
      
      if (paymentResult.success) {
        console.log('✅ 결제 및 검증 완료');
        
        // 서버에서 실제 하트 잔액 가져오기
        setProcessingMessage('하트 잔액 업데이트 중...');
        const updatedHearts = await refreshHeartBalance();
        
        // 성공 처리
        console.log('🎉 전체 구매 과정 완료');
        if (onPurchase) {
          console.log('📢 부모 컴포넌트에 구매 완료 알림');
          onPurchase({
            ...pack,
            success: true,
            newHeartBalance: updatedHearts || paymentResult.verification?.newBalance || (currentHearts + pack.hearts)
          });
        }
        
        const finalHeartBalance = updatedHearts || paymentResult.verification?.newBalance || (currentHearts + pack.hearts);
        alert(`🎉 ${pack.hearts}개 하트 구매 완료!\n새 잔액: ${finalHeartBalance}개`);
        
      } else {
        console.error('❌ 결제 실패:', paymentResult);
        throw new Error(paymentResult.error || '결제 실패');
      }
    } catch (error) {
      console.error('❌ 결제 과정 중 오류 발생:', {
        error: error,
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code
      });
      
      let errorMessage = '결제 중 오류가 발생했습니다.';
      
      if (error.message) {
        errorMessage = error.message;
        console.log('🔍 에러 메시지:', error.message);
      }
      
      // 사용자에게 더 친숙한 메시지 제공
      if (errorMessage.includes('등록된 PG')) {
        console.log('🚨 PG 설정 오류 감지');
        errorMessage = '결제 시스템 설정에 문제가 있습니다.\n잠시 후 다시 시도해주세요.';
      } else if (errorMessage.includes('취소')) {
        console.log('🚨 결제 취소 감지');
        errorMessage = '결제가 취소되었습니다.';
      } else if (errorMessage.includes('SDK')) {
        console.log('🚨 SDK 오류 감지');
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

  // 사용자 하트 잔액 새로고침 함수
  const refreshHeartBalance = async () => {
    try {
      const userId = localStorage.getItem('userId') || 'guest';
      const userEmail = localStorage.getItem('userEmail') || 'user@minglingchat.com';
      
      console.log('🔄 하트 잔액 새로고침 중...', { userId, userEmail });
      
      const response = await fetch(`http://localhost:8001/api/users/profile`, {
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
                <span>하트는 구매 즉시 계정에 추가됩니다</span>
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
              <p className="text-xs text-gray-500 mt-2">잠시만 기다려주세요...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeartShop; 