import React from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';

const CharacterIntroCard = ({ character, onStartChat }) => {
  return (
    <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
      <div className="text-center">
        <h2 className="text-gray-800 text-lg font-bold mb-4">첫인상</h2>
        
        {character.firstImpression ? (
          <p className="text-gray-700 text-base leading-relaxed mb-6">
            "{character.firstImpression}"
          </p>
        ) : character.description ? (
          <p className="text-gray-700 text-base leading-relaxed mb-6">
            "{character.description}"
          </p>
        ) : (
          <p className="text-gray-500 text-base leading-relaxed mb-6">
            "안녕하세요! 저와 함께 즐거운 대화를 나눠보세요."
          </p>
        )}

        <div className="space-y-3 mb-6">
          {character.personality && (
            <div className="flex items-center justify-center space-x-2">
              <span className="text-gray-500 text-sm">성격:</span>
              <span className="text-gray-700 text-sm font-medium">
                {character.personality}
              </span>
            </div>
          )}
          
          {character.user?.username && (
            <div className="flex items-center justify-center space-x-2">
              <span className="text-gray-500 text-sm">제작자:</span>
              <span className="text-gray-700 text-sm font-medium">
                {character.user.username}
              </span>
            </div>
          )}
        </div>

        {/* 대화 시작하기 버튼 */}
        <button 
          onClick={onStartChat}
          className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold text-base flex items-center justify-center space-x-2 hover:bg-purple-700 active:scale-95 transition-all shadow-md"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          <span>대화 시작하기</span>
        </button>
      </div>
    </div>
  );
};

export default CharacterIntroCard; 