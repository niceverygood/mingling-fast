import React from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';

const RecommendationTimer = ({ 
  countdown, 
  onAddCharacter, 
  addingCharacter, 
  hearts 
}) => {
  return (
    <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-2xl p-4 shadow-lg text-center">
      <div className="text-gray-700 text-sm mb-2">
        다음 캐릭터 추천까지 남은 시간
      </div>
      <div className="text-2xl font-bold text-gray-800 mb-3">
        {String(countdown.minutes).padStart(2, '0')}:{String(countdown.seconds).padStart(2, '0')}
      </div>
      <button
        onClick={onAddCharacter}
        disabled={addingCharacter || hearts < 5}
        className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition-all ${
          hearts < 5 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : addingCharacter
              ? 'bg-pink-300 text-white cursor-wait'
              : 'bg-pink-500 text-white hover:bg-pink-600 active:scale-95'
        }`}
      >
        {addingCharacter ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>추가하는 중...</span>
          </>
        ) : (
          <>
            <HeartIcon className="w-4 h-4" />
            <span>캐릭터 한장 더 추천 받기 (하트 5개 소모)</span>
          </>
        )}
      </button>
    </div>
  );
};

export default RecommendationTimer; 