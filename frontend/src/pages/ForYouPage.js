import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import PersonaSelection from './PersonaCreation/PersonaSelection';
import { charactersAPI } from '../services/api';
import Avatar from '../components/Avatar';

const ForYouPage = () => {
  const { isLoggedIn } = useAuth();
  const [characters, setCharacters] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPersonaSelection, setShowPersonaSelection] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // 터치/스와이프 관련 상태
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // 모바일 최적화를 위한 ref
  const containerRef = useRef(null);
  const cardRef = useRef(null);

  // 스와이프 감지 최소 거리 (모바일 최적화)
  const minSwipeDistance = 50;

  useEffect(() => {
    if (isLoggedIn) {
      fetchRecommendedCharacters();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchRecommendedCharacters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 게스트 모드로 캐릭터 로딩 시도...');
      try {
        const guestResponse = await fetch('https://api.minglingchat.com/api/characters/recommended', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (guestResponse.ok) {
          const guestData = await guestResponse.json();
          
          if (Array.isArray(guestData)) {
            setCharacters(guestData.map(char => ({ ...char, isOwner: false })));
            if (guestData.length > 0) {
              setCurrentIndex(0);
            }
            console.log('✅ 게스트 모드로 캐릭터 로딩 성공:', guestData.length, '개');
            return;
          }
        }
      } catch (guestError) {
        console.error('게스트 모드 시도 실패:', guestError);
      }
      
      console.log('🔄 인증 API 시도...');
      const response = await charactersAPI.getRecommended();
      
      if (Array.isArray(response.data)) {
        setCharacters(response.data);
        if (response.data.length > 0) {
          setCurrentIndex(0);
        }
        console.log('✅ 인증 API로 캐릭터 로딩 성공:', response.data.length, '개');
      } else {
        console.error('Received non-array response:', response.data);
        setCharacters([]);
        setError('캐릭터 데이터를 불러올 수 없습니다.');
      }
    } catch (error) {
      console.error('Error fetching recommended characters:', error);
      setCharacters([]);
      setError('캐릭터를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 터치 이벤트 핸들러 (모바일 최적화)
  const handleTouchStart = (e) => {
    setTouchStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    setTouchEndX(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);
    
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < characters.length - 1) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrevious();
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
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : characters.length - 1));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev < characters.length - 1 ? prev + 1 : 0));
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // 직접 슬라이드 선택 (터치 최적화)
  const handleSlideSelect = (index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  if (loading && isLoggedIn) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">추천 캐릭터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 게스트 화면 (모바일 최적화)
  if (!isLoggedIn) {
    return (
      <div className="relative w-full h-screen bg-black overflow-hidden touch-pan-y">
        {/* Background Image */}
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
            <span className="text-9xl">👤</span>
          </div>
          <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        </div>

        {/* Header - 모바일 최적화 */}
        <div className="relative z-10 flex items-center justify-between p-6 pt-14 safe-area-top">
          <div className="flex items-center space-x-3">
            <h1 className="text-white text-2xl font-bold">FOR YOU</h1>
            <span className="text-white text-xl">🤍</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="bg-black bg-opacity-60 rounded-full px-4 py-2">
              <span className="text-white text-sm font-medium">게스트</span>
            </div>
          </div>
        </div>

        {/* Character Info - 터치 최적화 */}
        <div className="relative z-10 absolute top-24 left-6 right-6">
          <div className="flex items-center space-x-4">
            <Avatar 
              src=""
              alt="AI 캐릭터"
              name="AI 캐릭터"
              size="lg"
              fallbackType="emoji"
            />
            <div className="flex-1">
              <h2 className="text-white text-xl font-bold mb-1">AI 캐릭터</h2>
              <p className="text-white text-base opacity-90">
                다양한 AI 캐릭터와 대화해보세요
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Arrows - 터치 최적화 */}
        <button 
          className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white opacity-50 touch-manipulation"
          disabled
        >
          <ChevronLeftIcon className="w-7 h-7" />
        </button>
        
        <button 
          className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white opacity-50 touch-manipulation"
          disabled
        >
          <ChevronRightIcon className="w-7 h-7" />
        </button>

        {/* Sample Character Description - 모바일 카드 디자인 */}
        <div className="absolute top-1/2 left-6 right-6 transform -translate-y-1/2 z-10">
          <div className="bg-black bg-opacity-80 rounded-3xl p-8 text-white backdrop-blur-sm">
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3 text-gray-200">밍글링이란?</h3>
              <p className="text-base leading-relaxed">
                AI 캐릭터와 실시간으로 대화할 수 있는 플랫폼입니다.
              </p>
            </div>
            
            <div>
              <h3 className="text-base font-semibold mb-3 text-gray-200">특징</h3>
              <p className="text-base leading-relaxed">
                다양한 성격과 배경을 가진 AI 캐릭터들과 자연스러운 대화를 나누세요.
              </p>
            </div>
          </div>
        </div>

        {/* Login CTA at bottom - 터치 최적화 */}
        <div className="absolute bottom-6 left-6 right-6 z-10 space-y-4 safe-area-bottom">
          <div className="bg-blue-600 bg-opacity-95 rounded-2xl p-6 text-center backdrop-blur-sm">
            <h3 className="text-white font-semibold mb-3 text-lg">채팅을 시작하려면 로그인하세요</h3>
            <p className="text-blue-100 text-base mb-4">AI 캐릭터와 대화하기 위해 로그인이 필요해요</p>
            <button 
              onClick={() => setShowLoginModal(true)}
              className="w-full bg-white text-blue-600 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 active:bg-gray-200 transition-colors touch-manipulation"
            >
              로그인하고 대화하기
            </button>
          </div>
          
          <div className="text-center">
            <p className="text-white text-base opacity-80">
              🔒 캐릭터와 상호작용하려면 로그인이 필요해요
            </p>
          </div>
        </div>

        {/* Slide Indicators - 터치 최적화 */}
        <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 z-10 flex space-x-3">
          {[1, 2, 3, 4, 5].map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full transition-all ${
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
          <p className="text-lg">추천 캐릭터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen bg-black p-6">
        <div className="text-white text-center">
          <div className="text-red-500 text-7xl mb-6">😞</div>
          <p className="mb-6 text-lg">{error}</p>
          <button 
            onClick={fetchRecommendedCharacters}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-8 py-4 rounded-full text-lg font-medium transition-colors touch-manipulation"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen bg-black p-6">
        <div className="text-white text-center">
          <div className="text-gray-400 text-8xl mb-6">🎭</div>
          <p className="mb-4 text-lg">아직 추천할 캐릭터가 없습니다.</p>
          <p className="text-gray-400 text-base mb-8">새로운 캐릭터를 만들어보세요!</p>
          <button 
            onClick={fetchRecommendedCharacters}
            className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-8 py-4 rounded-full text-lg font-medium transition-colors touch-manipulation"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  const currentCharacter = characters[currentIndex];

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-screen bg-black overflow-hidden touch-pan-y select-none"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        {currentCharacter.avatarUrl ? (
          <img 
            src={currentCharacter.avatarUrl} 
            alt={currentCharacter.name}
            className="w-full h-full object-cover transition-all duration-300"
            style={{ filter: 'brightness(0.8)' }}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-gray-800 to-black flex items-center justify-center">
            <span className="text-9xl">👤</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black bg-opacity-50"></div>
      </div>

      {/* Header - 모바일 최적화 */}
      <div className="relative z-10 flex items-center justify-between p-6 pt-14 safe-area-top">
        <div className="flex items-center space-x-3">
          <h1 className="text-white text-2xl font-bold">FOR YOU</h1>
        </div>
        <div className="text-white text-sm bg-black bg-opacity-50 rounded-full px-4 py-2">
          {currentIndex + 1} / {characters.length}
        </div>
      </div>

      {/* Character Info - 터치 최적화 */}
      <div className="relative z-10 absolute top-24 left-6 right-6">
        <div className="flex items-center space-x-4">
          <Avatar 
            src={currentCharacter.avatarUrl}
            alt={currentCharacter.name}
            name={currentCharacter.name}
            size="lg"
            fallbackType="emoji"
          />
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-1">
              <h2 className="text-white text-xl font-bold">{currentCharacter.name}</h2>
              {currentCharacter.isOwner && (
                <span className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                  내 캐릭터
                </span>
              )}
            </div>
            <p className="text-white text-base opacity-90 mb-1">
              {currentCharacter.age}세 | {currentCharacter.description}
            </p>
            <p className="text-white text-sm opacity-70">
              by {currentCharacter.user?.username || '익명'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Arrows - 터치 최적화 */}
      <button 
        onClick={handlePrevious}
        disabled={isTransitioning}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white backdrop-blur-sm active:bg-opacity-80 transition-all touch-manipulation disabled:opacity-50"
      >
        <ChevronLeftIcon className="w-7 h-7" />
      </button>
      
      <button 
        onClick={handleNext}
        disabled={isTransitioning}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-black bg-opacity-60 rounded-full flex items-center justify-center text-white backdrop-blur-sm active:bg-opacity-80 transition-all touch-manipulation disabled:opacity-50"
      >
        <ChevronRightIcon className="w-7 h-7" />
      </button>

      {/* Character Description Overlay - 모바일 카드 디자인 */}
      <div 
        ref={cardRef}
        className="absolute top-1/2 left-6 right-6 transform -translate-y-1/2 z-10"
      >
        <div className="bg-black bg-opacity-80 rounded-3xl p-8 text-white backdrop-blur-sm transition-all duration-300">
          {currentCharacter.firstImpression && (
            <div className="mb-6">
              <h3 className="text-base font-semibold mb-3 text-gray-200">첫인상</h3>
              <p className="text-base leading-relaxed">
                {currentCharacter.firstImpression}
              </p>
            </div>
          )}
          
          {currentCharacter.basicSetting && (
            <div>
              <h3 className="text-base font-semibold mb-3 text-gray-200">기본 설정</h3>
              <p className="text-base leading-relaxed">
                {currentCharacter.basicSetting}
              </p>
            </div>
          )}

          {!currentCharacter.firstImpression && !currentCharacter.basicSetting && (
            <p className="text-base leading-relaxed text-gray-300">
              이 캐릭터에 대한 추가 정보가 없습니다.
            </p>
          )}
        </div>
      </div>

      {/* Bottom Actions - 터치 최적화 */}
      <div className="absolute bottom-36 left-6 right-6 z-10">
        <button 
          onClick={handleStartChat}
          className="w-full bg-gray-600 bg-opacity-90 text-white py-5 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-3 backdrop-blur-sm active:bg-opacity-100 transition-all touch-manipulation"
        >
          <ChatBubbleLeftRightIcon className="w-6 h-6" />
          <span>대화하기</span>
        </button>
      </div>

      {/* Slide Indicators - 터치 최적화 */}
      <div className="absolute bottom-28 left-1/2 transform -translate-x-1/2 z-10 flex space-x-3">
        {characters.map((_, index) => (
          <button
            key={index}
            onClick={() => handleSlideSelect(index)}
            disabled={isTransitioning}
            className={`w-3 h-3 rounded-full transition-all touch-manipulation ${
              index === currentIndex 
                ? 'bg-white scale-125' 
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
            }`}
          />
        ))}
      </div>

      {/* Swipe Hint - 모바일 최적화 */}
      {characters.length > 1 && currentIndex === 0 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 text-center">
          <p className="text-white text-sm opacity-60 animate-pulse">
            ← 스와이프하여 다른 캐릭터 보기 →
          </p>
        </div>
      )}

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