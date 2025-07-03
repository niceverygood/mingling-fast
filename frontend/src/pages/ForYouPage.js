import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import PersonaSelection from './PersonaCreation/PersonaSelection';
import { charactersAPI } from '../services/api';

const ForYouPage = () => {
  const { isLoggedIn } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showPersonaSelection, setShowPersonaSelection] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchRecommendedCharacters();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchRecommendedCharacters = async () => {
    try {
      const response = await charactersAPI.getRecommended();
      // 응답이 배열인지 확인
      if (Array.isArray(response.data)) {
        setCharacters(response.data);
      } else {
        console.error('Received non-array response:', response.data);
        setCharacters([]);
      }
    } catch (error) {
      console.error('Error fetching recommended characters:', error);
      setCharacters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = () => {
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }
    setShowPersonaSelection(true);
  };

  const handleClosePersonaSelection = () => {
    setShowPersonaSelection(false);
  };

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : characters.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < characters.length - 1 ? prev + 1 : 0));
  };

  if (loading && isLoggedIn) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-white">로딩 중...</div>
      </div>
    );
  }

  // 로그인하지 않은 경우 게스트 화면
  if (!isLoggedIn) {
    const sampleCharacter = {
      name: '아리',
      age: '22',
      description: '미술학과 3학년'
    };

    return (
      <div className="relative w-full h-screen bg-black overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
            <span className="text-8xl">👤</span>
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 flex items-center justify-between p-4 pt-12">
          <div className="flex items-center space-x-2">
            <h1 className="text-white text-xl font-bold">FOR YOU</h1>
            <span className="text-white">🤍</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-black bg-opacity-50 rounded-full p-2">
              <span className="text-white text-sm">게스트</span>
            </div>
          </div>
        </div>

        {/* Character Info */}
        <div className="relative z-10 absolute top-20 left-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">🤖</span>
            </div>
            <div>
              <h2 className="text-white text-lg font-bold">{sampleCharacter.name}</h2>
              <p className="text-white text-sm opacity-80">
                {sampleCharacter.age}세 | {sampleCharacter.description}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white opacity-50"
          disabled
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        
        <button 
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white opacity-50"
          disabled
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>

        {/* Sample Character Description */}
        <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2 z-10">
          <div className="bg-black bg-opacity-70 rounded-2xl p-6 text-white">
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 text-gray-300">첫인상</h3>
              <p className="text-sm leading-relaxed">
                부모님께서 예전부터 진하셨던 아이라 때문는 (유치)와 함께 있구요 지건다.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-300">기본 설정</h3>
              <p className="text-sm leading-relaxed">
                (유치)와 축제하고는 정려된 친한 이상의 감정을 품게 된다.
              </p>
            </div>
          </div>
        </div>

        {/* Login CTA at bottom */}
        <div className="absolute bottom-4 left-4 right-4 z-10 space-y-3">
          <div className="bg-blue-600 bg-opacity-90 rounded-xl p-4 text-center">
            <h3 className="text-white font-medium mb-2">채팅을 시작하려면 로그인하세요</h3>
            <p className="text-blue-100 text-sm mb-3">AI 캐릭터와 대화하기 위해 로그인이 필요해요</p>
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-white text-blue-600 px-6 py-2 rounded-full font-medium hover:bg-gray-100"
            >
              로그인하고 대화하기
            </button>
          </div>
          
          {/* 캐릭터와 상호작용하지 않는 페이지 인디케이터 텍스트 */}
          <div className="text-center">
            <p className="text-white text-sm opacity-70">
              🔒 캐릭터와 상호작용하려면 로그인이 필요해요
            </p>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
          {[1, 2, 3, 4, 5].map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full ${
                index === 0 ? 'bg-white' : 'bg-white bg-opacity-50'
              }`}
            />
          ))}
        </div>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="채팅을 시작하려면 로그인하세요"
          subtitle="AI 캐릭터와 대화하기 위해 로그인이 필요해요"
        />
      </div>
    );
  }

  // 로그인한 경우 기존 코드
  if (characters.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-white text-center">
          <p className="mb-4">추천할 캐릭터가 없습니다.</p>
          <button 
            onClick={fetchRecommendedCharacters}
            className="bg-white text-black px-4 py-2 rounded-full"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const currentCharacter = characters[currentIndex];

  return (
    <div className="relative w-full h-screen bg-black overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentCharacter.avatarUrl ? (
          <img 
            src={currentCharacter.avatarUrl} 
            alt={currentCharacter.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
            <span className="text-8xl">👤</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-4 pt-12">
        <div className="flex items-center space-x-2">
          <h1 className="text-white text-xl font-bold">FOR YOU</h1>
        </div>
      </div>

      {/* Character Info */}
      <div className="relative z-10 absolute top-16 left-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
            {currentCharacter.avatarUrl ? (
              <img 
                src={currentCharacter.avatarUrl} 
                alt={currentCharacter.name} 
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <span className="text-white text-lg">🤖</span>
            )}
          </div>
          <div>
            <h2 className="text-white text-lg font-bold">{currentCharacter.name}</h2>
            <p className="text-white text-sm opacity-80">
              {currentCharacter.age}세 | {currentCharacter.description}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button 
        onClick={handlePrevious}
        className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white"
      >
        <ChevronLeftIcon className="w-6 h-6" />
      </button>
      
      <button 
        onClick={handleNext}
        className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-10 h-10 bg-black bg-opacity-50 rounded-full flex items-center justify-center text-white"
      >
        <ChevronRightIcon className="w-6 h-6" />
      </button>

      {/* Character Description Overlay - 화면 가운데 배치 */}
      <div className="absolute top-1/2 left-4 right-4 transform -translate-y-1/2 z-10">
        <div className="bg-black bg-opacity-70 rounded-2xl p-6 text-white">
          {currentCharacter.firstImpression && (
            <div className="mb-4">
              <h3 className="text-sm font-semibold mb-2 text-gray-300">첫인상</h3>
              <p className="text-sm leading-relaxed">
                {currentCharacter.firstImpression}
              </p>
            </div>
          )}
          
          {currentCharacter.basicSetting && (
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-300">기본 설정</h3>
              <p className="text-sm leading-relaxed">
                {currentCharacter.basicSetting}
              </p>
            </div>
          )}

          {!currentCharacter.firstImpression && !currentCharacter.basicSetting && (
            <p className="text-sm leading-relaxed text-gray-300">
              이 캐릭터에 대한 추가 정보가 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="absolute bottom-32 left-4 right-4 z-10">
        <button 
          onClick={handleStartChat}
          className="w-full bg-gray-600 bg-opacity-80 text-white py-4 rounded-full font-medium flex items-center justify-center space-x-2"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          <span>대화하기</span>
        </button>
      </div>

      {/* Slide Indicators */}
      <div className="absolute bottom-24 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
        {characters.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-2 h-2 rounded-full ${
              index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </div>

      {/* Persona Selection Modal */}
      <PersonaSelection
        isOpen={showPersonaSelection}
        onClose={handleClosePersonaSelection}
        characterId={currentCharacter?.id}
        characterName={currentCharacter?.name}
      />
    </div>
  );
};

export default ForYouPage;