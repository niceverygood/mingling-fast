import React, { useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolid } from '@heroicons/react/24/solid';

const HeartShop = ({ onClose, currentHearts, onPurchase }) => {
  // eslint-disable-next-line no-unused-vars
  const [selectedPack, setSelectedPack] = useState(null);

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

  const handlePurchase = (pack) => {
    setSelectedPack(pack);
    if (onPurchase) {
      onPurchase(pack);
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
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        pack.popular 
                          ? 'bg-blue-500 text-white' 
                          : 'bg-black text-white'
                      }`}
                    >
                      구매하기
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
      </div>
    </div>
  );
};

export default HeartShop; 