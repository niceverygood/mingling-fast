import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon, HeartIcon } from '@heroicons/react/24/solid';
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

  // 스와이프 감지 최소 거리
  const minSwipeDistance = 50;

  useEffect(() => {
    fetchRecommendedCharacters();
  }, [isLoggedIn]);

  const fetchRecommendedCharacters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 캐릭터 로딩 시도...');
      
      // 게스트 모드도 지원
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (isLoggedIn) {
        // 로그인한 사용자용 헤더 추가 (필요한 경우)
      }
      
      const response = await fetch('https://api.minglingchat.com/api/characters/recommended', {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setCharacters(data);
          if (data.length > 0) {
            setCurrentIndex(0);
          }
          console.log('✅ 캐릭터 로딩 성공:', data.length, '개');
        } else {
          console.error('Received non-array response:', data);
          setCharacters([]);
          setError('캐릭터 데이터를 불러올 수 없습니다.');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error fetching recommended characters:', error);
      setCharacters([]);
      setError('캐릭터를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
    } finally {
      setLoading(false);
    }
  };

  // 터치 이벤트 핸들러
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

  // 직접 슬라이드 선택
  const handleSlideSelect = (index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="flex justify-center items-center h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
          <div className="text-white text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
            <p className="text-lg font-medium">추천 캐릭터를 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  // 로그인하지 않은 경우 게스트 화면
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="relative w-full h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden">
          {/* Header */}
          <div className="relative z-10 flex items-center justify-between p-6 pt-14">
            <div className="flex items-center space-x-3">
              <h1 className="text-white text-2xl font-bold">FOR YOU</h1>
              <HeartIcon className="w-6 h-6 text-pink-300" />
            </div>
            <div className="bg-white bg-opacity-20 rounded-full px-4 py-2 backdrop-blur-sm">
              <span className="text-white text-sm font-medium">게스트</span>
            </div>
          </div>

          {/* Content */}
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="text-center text-white">
              <div className="text-8xl mb-6">💕</div>
              <h2 className="text-3xl font-bold mb-4">AI 캐릭터와 채팅하세요</h2>
              <p className="text-xl mb-8 opacity-90">다양한 성격의 AI 캐릭터들이 기다리고 있어요</p>
              
              <button 
                onClick={() => setShowLoginModal(true)}
                className="bg-white text-purple-600 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-100 active:bg-gray-200 transition-colors shadow-lg"
              >
                로그인하고 시작하기
              </button>
            </div>
          </div>

          {/* Login Modal */}
          <LoginModal
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            title="채팅을 시작하려면 로그인하세요"
            subtitle="AI 캐릭터와 대화하기 위해 로그인이 필요해요"
          />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="flex justify-center items-center h-screen bg-gradient-to-br from-red-400 to-pink-500 p-6">
          <div className="text-white text-center">
            <div className="text-6xl mb-6">😞</div>
            <h3 className="text-xl font-bold mb-4">문제가 발생했어요</h3>
            <p className="mb-6 text-base opacity-90">{error}</p>
            <button 
              onClick={fetchRecommendedCharacters}
              className="bg-white text-red-500 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
            >
              다시 시도
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (characters.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="flex justify-center items-center h-screen bg-gradient-to-br from-gray-400 to-gray-600 p-6">
          <div className="text-white text-center">
            <div className="text-7xl mb-6">🎭</div>
            <h3 className="text-xl font-bold mb-2">캐릭터가 없어요</h3>
            <p className="text-base opacity-90 mb-6">아직 추천할 캐릭터가 없습니다.</p>
            <button 
              onClick={fetchRecommendedCharacters}
              className="bg-white text-gray-600 px-8 py-3 rounded-full font-bold hover:bg-gray-100 transition-colors"
            >
              새로고침
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentCharacter = characters[currentIndex];

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <div 
        ref={containerRef}
        className="relative w-full h-screen overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Background Image with Blur */}
        <div className="absolute inset-0">
          {currentCharacter.avatarUrl ? (
            <>
              <img 
                src={currentCharacter.avatarUrl} 
                alt={currentCharacter.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 backdrop-blur-md bg-black bg-opacity-40"></div>
            </>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500">
              <div className="absolute inset-0 bg-black bg-opacity-30"></div>
            </div>
          )}
        </div>

        {/* Header - Character Profile */}
        <div className="relative z-10 p-6 pt-14">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Avatar 
                src={currentCharacter.avatarUrl}
                alt={currentCharacter.name}
                name={currentCharacter.name}
                size="lg"
                className="ring-4 ring-white ring-opacity-50"
              />
              <div>
                <h1 className="text-white text-xl font-bold">{currentCharacter.name}</h1>
                <div className="flex items-center space-x-2">
                  <p className="text-white text-sm opacity-90">
                    {currentCharacter.age && `${currentCharacter.age}세`}
                    {currentCharacter.age && currentCharacter.characterType && ' • '}
                    {currentCharacter.characterType}
                  </p>
                  {currentCharacter.isOwner && (
                    <span className="bg-white bg-opacity-20 text-white text-xs px-2 py-1 rounded-full">
                      내 캐릭터
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="bg-white bg-opacity-20 rounded-full px-3 py-1 backdrop-blur-sm">
                <span className="text-white text-sm font-medium">
                  {currentIndex + 1} / {characters.length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Arrows */}
        <button 
          onClick={handlePrevious}
          disabled={isTransitioning}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-opacity-30 active:bg-opacity-40 transition-all disabled:opacity-50"
        >
          <ChevronLeftIcon className="w-6 h-6" />
        </button>
        
        <button 
          onClick={handleNext}
          disabled={isTransitioning}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 z-20 w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-opacity-30 active:bg-opacity-40 transition-all disabled:opacity-50"
        >
          <ChevronRightIcon className="w-6 h-6" />
        </button>

        {/* First Impression Card - Center */}
        <div className="absolute top-1/2 left-6 right-6 transform -translate-y-1/2 z-10">
          <div className="bg-white bg-opacity-95 backdrop-blur-sm rounded-3xl p-8 shadow-2xl">
            <div className="text-center">
              <h2 className="text-gray-800 text-lg font-bold mb-4">첫인상</h2>
              
              {currentCharacter.firstImpression ? (
                <p className="text-gray-700 text-base leading-relaxed mb-6">
                  "{currentCharacter.firstImpression}"
                </p>
              ) : currentCharacter.description ? (
                <p className="text-gray-700 text-base leading-relaxed mb-6">
                  "{currentCharacter.description}"
                </p>
              ) : (
                <p className="text-gray-500 text-base leading-relaxed mb-6">
                  "안녕하세요! 저와 함께 즐거운 대화를 나눠보세요."
                </p>
              )}

              <div className="space-y-3">
                {currentCharacter.personality && (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-gray-500 text-sm">성격:</span>
                    <span className="text-gray-700 text-sm font-medium">
                      {currentCharacter.personality}
                    </span>
                  </div>
                )}
                
                {currentCharacter.user?.username && (
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-gray-500 text-sm">제작자:</span>
                    <span className="text-gray-700 text-sm font-medium">
                      {currentCharacter.user.username}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Chat Button - Bottom */}
        <div className="absolute bottom-24 left-6 right-6 z-10">
          <button 
            onClick={handleStartChat}
            className="w-full bg-white bg-opacity-95 text-gray-800 py-5 rounded-2xl font-bold text-lg flex items-center justify-center space-x-3 backdrop-blur-sm hover:bg-opacity-100 active:scale-95 transition-all shadow-lg"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-purple-600" />
            <span>대화 시작하기</span>
          </button>
        </div>

        {/* Swipe Hint */}
        {characters.length > 1 && currentIndex === 0 && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
            <p className="text-white text-xs opacity-60 animate-pulse">
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
    </div>
  );
};

export default ForYouPage;