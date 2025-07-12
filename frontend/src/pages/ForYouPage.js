import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { ChatBubbleLeftRightIcon, HeartIcon } from '@heroicons/react/24/solid';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import PersonaSelection from './PersonaCreation/PersonaSelection';
import { charactersAPI, heartsAPI } from '../services/api';
import Avatar from '../components/Avatar';
import { usePopup } from '../context/PopupContext';
import CharacterIntroCard from '../components/CharacterIntroCard';
import RecommendationTimer from '../components/RecommendationTimer';
import CharacterDetail from './CharacterCreation/CharacterDetail';

const ForYouPage = () => {
  const { isLoggedIn } = useAuth();
  const { showInsufficientHearts, showError } = usePopup();
  const [characters, setCharacters] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPersonaSelection, setShowPersonaSelection] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  
  // For You 페이지 전용 상태
  const [excludeIds, setExcludeIds] = useState([]);
  const [hearts, setHearts] = useState(150);
  const [addingCharacter, setAddingCharacter] = useState(false);
  const [refreshInfo, setRefreshInfo] = useState(null);
  const [countdown, setCountdown] = useState({ minutes: 0, seconds: 0 });
  const [showCharacterDetail, setShowCharacterDetail] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  
  // 터치/스와이프 관련 상태
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchEndX, setTouchEndX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // 모바일 최적화를 위한 ref
  const containerRef = useRef(null);
  const timerRef = useRef(null);

  // 스와이프 감지 최소 거리
  const minSwipeDistance = 50;

  useEffect(() => {
    if (isLoggedIn) {
      fetchForYouCharacters();
      fetchHeartBalance();
    }
  }, [isLoggedIn]);

  // 카운트다운 타이머 효과
  useEffect(() => {
    if (refreshInfo) {
      updateCountdown();
      timerRef.current = setInterval(updateCountdown, 1000);
      
      return () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
      };
    }
  }, [refreshInfo]);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  const fetchHeartBalance = async () => {
    try {
      const response = await heartsAPI.getBalance();
      if (response.data && typeof response.data.hearts === 'number') {
        setHearts(response.data.hearts);
      }
    } catch (error) {
      console.error('❌ 하트 잔액 조회 실패:', error);
    }
  };

  const fetchForYouCharacters = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🎯 For You 캐릭터 로딩 시도...', { excludeIds: excludeIds.length });
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      // 로그인한 사용자 헤더 추가
      if (isLoggedIn) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.uid) {
          headers['x-user-id'] = user.uid;
        }
      }
      
      // exclude 파라미터 추가
      const queryParams = excludeIds.length > 0 ? `?exclude=${excludeIds.join(',')}` : '';
      
      const response = await fetch(`https://api.minglingchat.com/api/characters/for-you${queryParams}`, {
        method: 'GET',
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.characters && Array.isArray(data.characters)) {
          setCharacters(data.characters);
          setRefreshInfo(data.refreshInfo);
          if (data.characters.length > 0) {
            setCurrentIndex(0);
          }
          console.log('✅ For You 캐릭터 로딩 성공:', data.characters.length, '개');
          console.log('⏰ 다음 새로고침:', data.refreshInfo.nextRefreshAt);
        } else {
          console.error('Received invalid response:', data);
          setCharacters([]);
          setError('캐릭터 데이터를 불러올 수 없습니다.');
        }
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('❌ For You 캐릭터 로딩 실패:', error);
      setCharacters([]);
      setError('캐릭터를 불러오는 중 오류가 발생했습니다. 페이지를 새로고침해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const updateCountdown = () => {
    if (!refreshInfo) return;
    
    const now = new Date().getTime();
    const nextRefresh = new Date(refreshInfo.nextRefreshAt).getTime();
    const timeDiff = nextRefresh - now;
    
    if (timeDiff <= 0) {
      setCountdown({ minutes: 0, seconds: 0 });
      // 자동 새로고침
      setTimeout(() => {
        setExcludeIds([]);
        fetchForYouCharacters();
      }, 1000);
    } else {
      const minutes = Math.floor(timeDiff / (1000 * 60));
      const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
      setCountdown({ minutes, seconds });
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

    // 좌우 스와이프 처리 (무한 루프 제거)
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

  const handleAvatarClick = () => {
    setSelectedCharacter(currentCharacter);
    setShowCharacterDetail(true);
  };

  const handleCloseCharacterDetail = () => {
    setShowCharacterDetail(false);
    setSelectedCharacter(null);
  };

  const handlePrevious = () => {
    if (isTransitioning || currentIndex <= 0) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev - 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleNext = () => {
    if (isTransitioning || currentIndex >= characters.length - 1) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => prev + 1);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const handleAddCharacter = async () => {
    if (addingCharacter) return;
    
    if (hearts < 5) {
      showInsufficientHearts(hearts, {
        onConfirm: () => {
          // 하트샵으로 이동 로직 (필요한 경우)
        },
        onCancel: () => {}
      });
      return;
    }

    try {
      setAddingCharacter(true);
      console.log('💎 하트로 캐릭터 추가 요청...');

      const headers = {
        'Content-Type': 'application/json'
      };

      if (isLoggedIn) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        if (user.uid) {
          headers['x-user-id'] = user.uid;
        }
      }

      const currentCharacterIds = characters.map(char => char.id);
      const allExcludeIds = [...excludeIds, ...currentCharacterIds];

      const response = await fetch('https://api.minglingchat.com/api/characters/for-you/add', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          excludeIds: allExcludeIds
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // 새로운 캐릭터를 맨 앞에 추가
        setCharacters(prev => [data.character, ...prev]);
        setHearts(data.remainingHearts);
        setCurrentIndex(0); // 새 캐릭터로 이동
        
        console.log('✅ 캐릭터 추가 성공:', data.character.name);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '캐릭터 추가에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 캐릭터 추가 실패:', error);
      showError(error.message || '캐릭터 추가 중 오류가 발생했습니다.');
    } finally {
      setAddingCharacter(false);
    }
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
      <div className="max-w-md mx-auto bg-white" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <div className="flex justify-center items-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500" style={{ height: 'calc(100vh - 60px)' }}>
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
      <div className="max-w-md mx-auto bg-white" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <div className="relative w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 overflow-hidden" style={{ height: 'calc(100vh - 60px)' }}>
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
      <div className="max-w-md mx-auto bg-white" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <div className="flex justify-center items-center bg-gradient-to-br from-red-400 to-pink-500 p-6" style={{ height: 'calc(100vh - 60px)' }}>
          <div className="text-white text-center">
            <div className="text-6xl mb-6">😞</div>
            <h3 className="text-xl font-bold mb-4">문제가 발생했어요</h3>
            <p className="mb-6 text-base opacity-90">{error}</p>
            <button 
              onClick={fetchForYouCharacters}
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
      <div className="max-w-md mx-auto bg-white" style={{ minHeight: 'calc(100vh - 60px)' }}>
        <div className="flex justify-center items-center bg-gradient-to-br from-gray-400 to-gray-600 p-6" style={{ height: 'calc(100vh - 60px)' }}>
          <div className="text-white text-center">
            <div className="text-7xl mb-6">🎭</div>
            <h3 className="text-xl font-bold mb-2">캐릭터가 없어요</h3>
            <p className="text-base opacity-90 mb-6">아직 추천할 캐릭터가 없습니다.</p>
            <button 
              onClick={fetchForYouCharacters}
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
    <div className="max-w-md mx-auto bg-white" style={{ minHeight: 'calc(100vh - 60px)' }}>
      <div 
        ref={containerRef}
        className="relative w-full overflow-hidden"
        style={{ height: 'calc(100vh - 60px)' }}
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

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button 
            onClick={handlePrevious}
            disabled={isTransitioning}
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-opacity-30 active:bg-opacity-40 transition-all disabled:opacity-50"
          >
            <ChevronLeftIcon className="w-6 h-6" />
          </button>
        )}
        
        {currentIndex < characters.length - 1 && (
          <button 
            onClick={handleNext}
            disabled={isTransitioning}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-30 w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-white backdrop-blur-sm hover:bg-opacity-30 active:bg-opacity-40 transition-all disabled:opacity-50"
          >
            <ChevronRightIcon className="w-6 h-6" />
          </button>
        )}

        {/* Main Content Flow */}
        <div className="relative z-10 h-full flex flex-col justify-between p-6 pt-12">
          {/* Character Profile Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Avatar 
                src={currentCharacter.avatarUrl}
                alt={currentCharacter.name}
                name={currentCharacter.name}
                size="lg"
                className="ring-4 ring-white ring-opacity-50"
                onClick={handleAvatarClick}
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

          {/* Character Introduction Card */}
          <div className="flex-1 flex items-center justify-center">
            <CharacterIntroCard 
              character={currentCharacter} 
              onStartChat={handleStartChat}
            />
          </div>

          {/* Recommendation Timer */}
          <div className="mt-6">
            <RecommendationTimer
              countdown={countdown}
              onAddCharacter={handleAddCharacter}
              addingCharacter={addingCharacter}
              hearts={hearts}
            />
          </div>
        </div>

        {/* Persona Selection Modal */}
        <PersonaSelection
          isOpen={showPersonaSelection}
          onClose={handleClosePersonaSelection}
          characterId={currentCharacter?.id}
          characterName={currentCharacter?.name}
        />

        {/* Character Detail Modal */}
        {showCharacterDetail && selectedCharacter && (
          <CharacterDetail
            characterId={selectedCharacter.id}
            onClose={handleCloseCharacterDetail}
            onEdit={() => {}} // 편집 기능은 비활성화
          />
        )}
      </div>
    </div>
  );
};

export default ForYouPage;