import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const CharacterIntroCard = ({ character, onStartChat }) => {
  const handleButtonClick = (e) => {
    // 터치 이벤트 전파 방지
    e.preventDefault();
    e.stopPropagation();
    
    console.log('🔘 대화 시작 버튼 클릭됨');
    onStartChat();
  };

  return (
    <div 
      className="w-full max-w-sm mx-auto card-modern p-6 shadow-lg" 
      data-interactive="true"
      style={{ pointerEvents: 'auto' }}
    >
      <div className="text-center">
        {/* 첫인상 또는 설명 */}
        <div className="mb-6">
          {character.firstImpression ? (
            <p className="text-lg text-gray-800 leading-relaxed font-medium">
              "{character.firstImpression}"
            </p>
          ) : character.description ? (
            <p className="text-lg text-gray-800 leading-relaxed font-medium">
              "{character.description}"
            </p>
          ) : (
            <p className="text-lg text-gray-600 leading-relaxed font-medium">
              "안녕하세요! 저와 함께 즐거운 대화를 나눠보세요."
            </p>
          )}
        </div>

        {/* 성격 정보 */}
        {character.personality && (
          <div className="mb-6">
            <span className="inline-block bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              {character.personality}
            </span>
          </div>
        )}

        {/* 대화 시작하기 버튼 */}
        <button 
          onClick={handleButtonClick}
          onTouchStart={(e) => e.stopPropagation()}
          onTouchEnd={(e) => e.stopPropagation()}
          style={{ 
            touchAction: 'manipulation',
            pointerEvents: 'auto',
            WebkitTapHighlightColor: 'transparent'
          }}
          className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white border-0 touch-optimized py-3 rounded-xl font-medium text-body-md flex items-center justify-center space-x-2 active:scale-95 transition-all shadow-md relative z-20 hover:from-pink-600 hover:to-purple-700"
        >
          <ChatBubbleLeftRightIcon className="w-4 h-4 text-white" />
          <span className="text-white">대화 시작하기</span>
        </button>
      </div>
    </div>
  );
};

export default CharacterIntroCard; 