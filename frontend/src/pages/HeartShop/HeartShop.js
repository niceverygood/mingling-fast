import React, { useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';
import { getPaymentService } from '../../services/payment';

const HeartShop = ({ onClose, currentHearts, onPurchase }) => {
  const [selectedPack, setSelectedPack] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');

  console.log('💖 HeartShop 컴포넌트 렌더링:', { currentHearts, onPurchase: !!onPurchase });

  // PaymentService 인스턴스 가져오기
  const paymentService = getPaymentService();

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
    if (isProcessing) return;

    try {
      setIsProcessing(true);
      setSelectedPack(pack);
      setProcessingMessage('결제 준비 중...');

      console.log('🛒 하트 구매 시작:', pack);

      // 사용자 정보 가져오기
      const userId = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      
      if (!userId || !userEmail) {
        throw new Error('로그인이 필요합니다.');
      }

      console.log('👤 사용자 정보:', { userId, userEmail });

      // SDK 로드
      setProcessingMessage('결제 모듈 로딩 중...');
      await paymentService.loadSDK();

      // 결제 요청
      setProcessingMessage('결제 진행 중...');
      const result = await paymentService.purchaseHearts(pack.id, {
        userId,
        email: userEmail,
        name: userEmail.split('@')[0]
      });

      console.log('✅ 하트 구매 완료:', result);

              // 성공 처리
        if (result.success) {
          setProcessingMessage('하트 충전 완료!');
          
          // 최신 하트 잔액 계산 (우선순위: 실시간 조회 > 서버 응답 > 계산값)
          const finalBalance = result.currentHeartBalance || 
                              result.chargeResult?.newBalance || 
                              (currentHearts + pack.hearts);
          
          console.log('📊 하트 잔액 업데이트:', {
            이전잔액: currentHearts,
            추가하트: pack.hearts,
            서버응답: result.chargeResult?.newBalance,
            실시간조회: result.currentHeartBalance,
            최종잔액: finalBalance
          });
          
          // 부모 컴포넌트에 성공 알림 (실시간 하트 잔액 포함)
          if (onPurchase) {
            onPurchase({
              hearts: pack.hearts,
              newBalance: finalBalance,
              addedHearts: result.addedHearts || pack.hearts,
              message: result.message,
              realTimeBalance: result.currentHeartBalance // 실시간 조회 값 포함
            });
          }

          // 잠시 후 모달 닫기
          setTimeout(() => {
            setIsProcessing(false);
            setSelectedPack(null);
            onClose();
          }, 2000);
        } else {
          throw new Error(result.message || '하트 구매에 실패했습니다.');
        }

    } catch (error) {
      console.error('❌ 하트 구매 실패:', error);
      
      setProcessingMessage('');
      setIsProcessing(false);
      setSelectedPack(null);

      // 에러 메시지 표시
      let errorMessage = '하트 구매에 실패했습니다.';
      
      if (error.message.includes('로그인')) {
        errorMessage = '로그인이 필요합니다.';
      } else if (error.message.includes('취소')) {
        errorMessage = '결제가 취소되었습니다.';
      } else if (error.message.includes('결제')) {
        errorMessage = '결제 처리 중 오류가 발생했습니다.';
      }

      alert(errorMessage);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b p-4 flex items-center">
          <button onClick={onClose} className="mr-3">
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-bold">하트 충전</h2>
        </div>

        {/* 현재 하트 표시 */}
        <div className="p-4 bg-gradient-to-r from-pink-50 to-red-50">
          <div className="flex items-center justify-center">
            <HeartSolid className="w-8 h-8 text-red-500 mr-2" />
            <span className="text-2xl font-bold text-gray-800">{currentHearts || 0}</span>
          </div>
          <p className="text-center text-gray-600 mt-1">보유 하트</p>
        </div>

        {/* 하트 패키지 리스트 */}
        <div className="p-4 space-y-3">
          {heartPacks.map((pack) => (
            <div
              key={pack.id}
              className={`relative border-2 rounded-xl p-4 cursor-pointer transition-all ${
                pack.popular 
                  ? 'border-pink-500 bg-gradient-to-r from-pink-50 to-red-50' 
                  : 'border-gray-200 hover:border-pink-300'
              } ${
                selectedPack?.id === pack.id ? 'ring-2 ring-pink-500' : ''
              } ${
                isProcessing && selectedPack?.id !== pack.id ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              onClick={() => handlePurchase(pack)}
            >
              {pack.popular && (
                <div className="absolute -top-2 left-4 bg-pink-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                  인기
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{pack.icon}</span>
                  <div>
                    <h3 className="font-bold text-lg">{pack.name}</h3>
                    <div className="flex items-center">
                      <HeartSolid className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-gray-600">{pack.hearts}개</span>
                    </div>
                    {pack.discount && (
                      <span className="text-xs text-red-600 font-semibold">{pack.discount}</span>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  {pack.originalPrice && (
                    <div className="text-sm text-gray-400 line-through">
                      ₩{pack.originalPrice.toLocaleString()}
                    </div>
                  )}
                  <div className="font-bold text-lg">
                    ₩{pack.price.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* 처리 중 오버레이 */}
              {isProcessing && selectedPack?.id === pack.id && (
                <div className="absolute inset-0 bg-white bg-opacity-90 rounded-xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto mb-2"></div>
                    <p className="text-sm text-gray-600">{processingMessage}</p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* 안내 문구 */}
        <div className="p-4 border-t bg-gray-50">
          <p className="text-xs text-gray-500 text-center">
            구매한 하트는 즉시 계정에 충전되며, 환불이 불가능합니다.
          </p>
        </div>
      </div>
    </div>
  );
};

export default HeartShop; 