import React, { useState, useEffect } from 'react';
import { CogIcon, PlusIcon, TrashIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { HeartIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { usersAPI, charactersAPI, personasAPI, heartsAPI, chatsAPI } from '../services/api';
import CharacterCreation from './CharacterCreation/CharacterCreation';
import CharacterEdit from './CharacterCreation/CharacterEdit';
import CharacterDetail from './CharacterCreation/CharacterDetail';
import PersonaCreation from './PersonaCreation/PersonaCreation';
import PersonaEdit from './PersonaCreation/PersonaEdit';
import PersonaDetail from './PersonaCreation/PersonaDetail';
import PersonaSelection from './PersonaCreation/PersonaSelection';
import HeartShop from './HeartShop/HeartShop';
import Settings from './Settings/Settings';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import Avatar from '../components/Avatar';
import { goToHeartShop } from '../utils/webview';
import FavorabilityGauge from '../components/FavorabilityGauge';
import { getAllRelations } from '../services/favorabilityAPI';

const MyPage = () => {
  const { isLoggedIn, user: authUser } = useAuth();
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('characters');
  const [myCharacters, setMyCharacters] = useState([]);
  const [myPersonas, setMyPersonas] = useState([]);
  const [showCharacterCreation, setShowCharacterCreation] = useState(false);
  const [showCharacterEdit, setShowCharacterEdit] = useState(false);
  const [showCharacterDetail, setShowCharacterDetail] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showPersonaCreation, setShowPersonaCreation] = useState(false);
  const [showPersonaEdit, setShowPersonaEdit] = useState(false);
  const [showPersonaDetail, setShowPersonaDetail] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [showHeartShop, setShowHeartShop] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showPersonaSelection, setShowPersonaSelection] = useState(false);
  const [selectedCharacterForChat, setSelectedCharacterForChat] = useState(null);
  const [relations, setRelations] = useState([]);
  // eslint-disable-next-line no-unused-vars  
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn && authUser) {
      fetchUserData();
      fetchMyCharacters();
      fetchMyPersonas();
      fetchRelations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, authUser]);

  const fetchRelations = async () => {
    try {
      const relationsData = await getAllRelations();
      setRelations(relationsData);
    } catch (error) {
      console.error('Error fetching relations:', error);
      setRelations([]);
    }
  };

  const fetchUserData = async () => {
    try {
      // Firebase 사용자 정보를 기본으로 사용
      if (authUser) {
        setUser({
          id: authUser.uid,
          username: authUser.displayName || authUser.email?.split('@')[0] || '사용자',
          email: authUser.email,
          avatarUrl: authUser.photoURL,
          hearts: 150 // 기본값
        });
      }

      // 백엔드에서 추가 정보 가져오기 (선택사항)
      try {
        const response = await usersAPI.getProfile();
        if (response.data && authUser) {
          setUser(prev => ({
            ...prev,
            hearts: response.data.hearts || 150,
            joinedAt: response.data.joinedAt
          }));
        }
      } catch (error) {
        console.log('Backend user data not available, using Firebase data only');
      }
    } catch (error) {
      console.error('Error setting user data:', error);
      // Firebase 사용자 정보도 없으면 기본값 설정
      setUser({
        id: 'guest',
        username: '사용자',
        email: '',
        avatarUrl: null,
        hearts: 150
      });
    }
  };

  const fetchMyCharacters = async () => {
    try {
      const response = await charactersAPI.getMy();
      // 응답이 배열인지 확인
      if (Array.isArray(response.data)) {
        setMyCharacters(response.data);
      } else {
        console.error('Received non-array response:', response.data);
        setMyCharacters([]);
      }
    } catch (error) {
      console.error('Error fetching my characters:', error);
      setMyCharacters([]);
    }
  };

  const fetchMyPersonas = async () => {
    try {
      const response = await personasAPI.getMy();
      // 응답이 배열인지 확인
      if (Array.isArray(response.data)) {
        setMyPersonas(response.data);
      } else {
        console.error('Received non-array response:', response.data);
        setMyPersonas([]);
      }
    } catch (error) {
      console.error('Error fetching my personas:', error);
      setMyPersonas([]);
    }
  };

  const handleChargeHearts = () => {
    goToHeartShop(navigate, setShowHeartShop);
  };

  const handleHeartPurchase = async (purchaseData) => {
    try {
      console.log('💎 MyPage에서 하트 구매 완료 처리:', purchaseData);
      
      // 1. 실시간 하트 잔액 업데이트 (우선순위: 실시간 조회 > 서버 응답 > 계산값)
      const newHeartBalance = purchaseData.realTimeBalance || 
                             purchaseData.newBalance || 
                             ((user?.hearts || 150) + purchaseData.hearts);
      
      console.log('📊 하트 잔액 업데이트:', {
        이전잔액: user?.hearts,
        추가하트: purchaseData.hearts,
        새로운잔액: newHeartBalance,
        실시간조회: purchaseData.realTimeBalance,
        서버응답: purchaseData.newBalance
      });
      
      // 2. 사용자 상태 즉시 업데이트
      setUser(prev => ({
        ...prev,
        hearts: newHeartBalance
      }));
      
      // 3. 하트샵 모달 닫기
      setShowHeartShop(false);
      
      // 4. 성공 메시지 표시
      alert(`${purchaseData.hearts}개의 하트가 성공적으로 충전되었습니다!\n현재 하트: ${newHeartBalance}개`);
      
      // 5. 백그라운드에서 서버 데이터 재동기화 (선택사항)
      try {
        await fetchUserData();
      } catch (error) {
        console.log('⚠️ 백그라운드 데이터 동기화 실패 (무시):', error);
      }
      
    } catch (error) {
      console.error('❌ 하트 구매 처리 실패:', error);
      alert('하트 구매 처리 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleCreateCharacter = () => {
    setShowCharacterCreation(true);
  };

  const handleCharacterCreationComplete = (newCharacter) => {
    setShowCharacterCreation(false);
    fetchMyCharacters(); // 캐릭터 목록 새로고침
    alert(`${newCharacter.name} 캐릭터가 성공적으로 생성되었습니다!`);
  };

  const handleCharacterCreationClose = () => {
    setShowCharacterCreation(false);
  };

  const handleCharacterClick = (character) => {
    setSelectedCharacter(character);
    setShowCharacterDetail(true);
  };

  const handleCharacterEdit = (character) => {
    setSelectedCharacter(character);
    setShowCharacterEdit(true);
  };

  const handleCharacterEditFromDetail = (character) => {
    setShowCharacterDetail(false);
    setSelectedCharacter(character);
    setShowCharacterEdit(true);
  };

  const handleCharacterUpdate = (updatedCharacter) => {
    fetchMyCharacters(); // 캐릭터 목록 새로고침
    setShowCharacterEdit(false);
    setSelectedCharacter(null);
    alert(`${updatedCharacter.name} 캐릭터가 성공적으로 수정되었습니다!`);
  };

  const handlePersonaCreationComplete = (newPersona) => {
    setShowPersonaCreation(false);
    fetchMyPersonas(); // 페르소나 목록 새로고침
    alert(`${newPersona.name} 페르소나가 성공적으로 생성되었습니다!`);
  };

  const handlePersonaCreationClose = () => {
    setShowPersonaCreation(false);
  };

  const handleCreatePersona = () => {
    setShowPersonaCreation(true);
  };

  const handlePersonaClick = (persona) => {
    setSelectedPersona(persona);
    setShowPersonaDetail(true);
  };

  const handlePersonaEdit = (persona) => {
    setSelectedPersona(persona);
    setShowPersonaEdit(true);
  };

  const handlePersonaEditFromDetail = (persona) => {
    setShowPersonaDetail(false);
    setSelectedPersona(persona);
    setShowPersonaEdit(true);
  };

  const handlePersonaUpdate = (updatedPersona) => {
    fetchMyPersonas(); // 페르소나 목록 새로고침
    setShowPersonaEdit(false);
    setSelectedPersona(null);
    alert(`${updatedPersona.name} 페르소나가 성공적으로 수정되었습니다!`);
  };

  const handleSettings = () => {
    setShowSettings(true);
  };

  const handleCharacterDelete = async (character) => {
    const confirmDelete = window.confirm(
      `정말로 "${character.name}" 캐릭터를 삭제하시겠습니까?\n\n` +
      `⚠️ 주의: 이 캐릭터와의 대화 기록이 있는 경우 캐릭터는 비활성화되며, ` +
      `대화 기록이 없는 경우 완전히 삭제됩니다.`
    );

    if (!confirmDelete) return;

    try {
      const response = await charactersAPI.delete(character.id);
      
      if (response.data.type === 'deactivated') {
        alert('캐릭터가 비활성화되었습니다. (기존 대화 기록이 있어 완전 삭제되지 않았습니다)');
      } else {
        alert('캐릭터가 완전히 삭제되었습니다.');
      }
      
      fetchMyCharacters(); // 캐릭터 목록 새로고침
    } catch (error) {
      console.error('Error deleting character:', error);
      if (error.response?.status === 403) {
        alert('자신이 만든 캐릭터만 삭제할 수 있습니다.');
      } else {
        alert('캐릭터 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handlePersonaDelete = async (persona) => {
    const confirmDelete = window.confirm(
      `정말로 "${persona.name}" 페르소나를 삭제하시겠습니까?\n\n` +
      `⚠️ 주의: 이 페르소나와 연결된 대화 기록이 있는 경우 페르소나는 비활성화되며, ` +
      `대화 기록이 없는 경우 완전히 삭제됩니다.`
    );

    if (!confirmDelete) return;

    try {
      const response = await personasAPI.delete(persona.id);
      
      if (response.data.type === 'deactivated') {
        alert('페르소나가 비활성화되었습니다. (기존 대화 기록이 있어 완전 삭제되지 않았습니다)');
      } else {
        alert('페르소나가 완전히 삭제되었습니다.');
      }
      
      fetchMyPersonas(); // 페르소나 목록 새로고침
    } catch (error) {
      console.error('Error deleting persona:', error);
      if (error.response?.status === 403) {
        alert('자신이 만든 페르소나만 삭제할 수 있습니다.');
      } else {
        alert('페르소나 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  const handleCharacterChat = (character) => {
    setSelectedCharacterForChat(character);
    setShowPersonaSelection(true);
  };

  const handleClosePersonaSelection = () => {
    setShowPersonaSelection(false);
    setSelectedCharacterForChat(null);
  };

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen pb-20">
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <h1 className="text-xl font-bold">MY</h1>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <CogIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>
        <p className="text-sm text-gray-500 px-4 mb-6">내 정보 및 관리</p>

        {/* Guest Profile */}
        <div className="px-4 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Avatar 
              src=""
              alt="게스트"
              name="게스트"
              size="lg"
              fallbackType="icon"
            />
            <div>
              <h2 className="text-lg font-semibold">게스트</h2>
              <p className="text-sm text-gray-500">게스트</p>
              <p className="text-sm text-gray-500">로그인하고 더 많은 기능을 이용하세요</p>
            </div>
          </div>

          {/* Login CTA */}
          <div className="bg-blue-50 p-4 rounded-xl">
            <h3 className="font-medium text-blue-900 mb-2">더 많은 기능을 이용하세요</h3>
            <p className="text-sm text-blue-700 mb-4">로그인하고 나만의 캐릭터와 페르소나를 만들어보세요</p>
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-blue-500 text-white px-6 py-2 rounded-full font-medium hover:bg-blue-600"
            >
              로그인하기
            </button>
          </div>
        </div>

        {/* Guest Content */}
        <div className="px-4">
          <div className="bg-gray-50 rounded-xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-3xl">🔒</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">로그인이 필요해요</h3>
            <p className="text-sm text-gray-600 mb-6">나만의 AI 캐릭터를 만들고 관리하려면 로그인해주세요</p>
            <button 
              onClick={() => setShowLoginModal(true)}
              className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800"
            >
              로그인하기
            </button>
          </div>
        </div>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="로그인하고 더 많은 기능을 이용하세요"
          subtitle="나만의 캐릭터와 페르소나를 만들어보세요"
        />

        {/* Settings Modal */}
        {showSettings && (
          <Settings onClose={() => setShowSettings(false)} />
        )}
      </div>
    );
  }

  // 로그인은 되었지만 사용자 데이터가 아직 로드되지 않은 경우
  if (isLoggedIn && !user) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="text-gray-500">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-20 hide-scrollbar">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-black">MY</h1>
        <p className="text-sm text-gray-500 mt-1">내 정보 및 관리</p>
      </div>

      {/* Profile Section */}
      <div className="px-4 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Avatar 
              src={authUser?.photoURL}
              alt="프로필"
              name={authUser?.displayName || authUser?.email || '사용자'}
              size="md"
              fallbackType="icon"
            />
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-medium text-black">
                  {authUser?.displayName || authUser?.email || '사용자'}
                </span>
                <span className="text-sm text-gray-500">🍃 Lv.</span>
              </div>
              <p className="text-sm text-gray-400">
                Google 가입 • {user?.hearts || 150}개의 하트
              </p>
            </div>
          </div>
          <button onClick={handleSettings} className="p-2">
            <CogIcon className="w-6 h-6 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Heart Section */}
      <div className="px-4 py-4">
        <div className="bg-pink-50 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <HeartIcon className="w-8 h-8 text-pink-500" />
            <div>
              <p className="text-sm text-gray-600">내 하트</p>
              <p className="text-2xl font-bold text-pink-600">{user?.hearts || 150}</p>
            </div>
          </div>
          <button 
            onClick={handleChargeHearts}
            className="bg-pink-500 text-white px-6 py-2 rounded-full font-medium flex items-center space-x-1"
          >
            <PlusIcon className="w-4 h-4" />
            <span>충전</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('characters')}
            className={`flex-1 py-4 text-center font-medium ${
              activeTab === 'characters'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500'
            }`}
          >
            내 캐릭터
          </button>
          <button
            onClick={() => setActiveTab('personas')}
            className={`flex-1 py-4 text-center font-medium ${
              activeTab === 'personas'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500'
            }`}
          >
            내 페르소나
          </button>
          <button
            onClick={() => setActiveTab('relations')}
            className={`flex-1 py-4 text-center font-medium ${
              activeTab === 'relations'
                ? 'text-black border-b-2 border-black'
                : 'text-gray-500'
            }`}
          >
            관계 현황
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4">
        {activeTab === 'characters' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black">생성한 캐릭터</h3>
              <button 
                onClick={handleCreateCharacter}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="text-sm">새 캐릭터</span>
              </button>
            </div>

            {myCharacters.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                  ⭐
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  아직 만든 캐릭터가 없어요
                </h4>
                <p className="text-gray-500 mb-6">
                  나만의 AI 캐릭터를 만들어보세요!
                </p>
                <button 
                  onClick={handleCreateCharacter}
                  className="bg-black text-white px-8 py-3 rounded-full font-medium flex items-center space-x-2 mx-auto hover:bg-gray-800"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>첫 캐릭터 만들기</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myCharacters.map((character) => (
                  <div 
                    key={character.id}
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div 
                      className="flex items-center space-x-3 cursor-pointer"
                      onClick={() => handleCharacterClick(character)}
                    >
                      <Avatar 
                        src={character.avatarUrl}
                        alt={character.name}
                        name={character.name}
                        size="md"
                        fallbackType="emoji"
                      />
                      <div className="flex-1 text-left">
                        <h5 className="font-medium text-black text-left">{character.name}</h5>
                        <p className="text-sm text-gray-500 text-left">{character.description}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          {character.age && (
                            <span className="text-xs text-gray-400">{character.age}세</span>
                          )}
                          {character.age && character.characterType && <span className="text-xs text-gray-400">•</span>}
                          {character.characterType && (
                            <span className="text-xs text-gray-400">{character.characterType}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* 버튼 영역 */}
                    <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCharacterChat(character);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 rounded-md transition-all duration-200"
                        title="대화하기"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        <span>대화하기</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCharacterEdit(character);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 rounded-md transition-all duration-200"
                        title="편집"
                      >
                        <span>편집</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCharacterDelete(character);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 bg-red-50 hover:bg-red-100 rounded-md transition-all duration-200"
                        title="삭제"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'personas' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black">생성한 페르소나</h3>
              <button 
                onClick={handleCreatePersona}
                className="flex items-center space-x-1 text-gray-600 hover:text-gray-800"
              >
                <PlusIcon className="w-4 h-4" />
                <span className="text-sm">새 페르소나</span>
              </button>
            </div>

            {myPersonas.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  아직 만든 페르소나가 없어요
                </h4>
                <p className="text-gray-500 mb-6">
                  나만의 페르소나를 만들어서 AI 캐릭터들과 대화해보세요
                </p>
                <button 
                  onClick={handleCreatePersona}
                  className="bg-black text-white px-8 py-3 rounded-full font-medium flex items-center space-x-2 mx-auto hover:bg-gray-800"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span>첫 페르소나 만들기</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {myPersonas.map((persona) => (
                  <div 
                    key={persona.id}
                    className="bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
                  >
                    <div 
                      className="flex items-center space-x-3 cursor-pointer"
                      onClick={() => handlePersonaClick(persona)}
                    >
                      <Avatar 
                        src={persona.avatarUrl}
                        alt={persona.name}
                        name={persona.name}
                        size="md"
                        fallbackType="initial"
                      />
                      <div className="flex-1 text-left">
                        <h5 className="font-medium text-black text-left">{persona.name}</h5>
                        <p className="text-sm text-gray-500 text-left">
                          {persona.age && `${persona.age}세`} {persona.age && persona.job && '•'} {persona.job || '직업 미설정'}
                        </p>
                        <p className="text-xs text-gray-400 text-left">
                          {persona.gender === 'male' ? '남성' : persona.gender === 'female' ? '여성' : '성별 비공개'}
                        </p>
                        {persona.basicInfo && (
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2 text-left">
                            {persona.basicInfo}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* 버튼 영역 */}
                    <div className="flex items-center justify-end space-x-2 mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePersonaEdit(persona);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 rounded-md transition-all duration-200"
                        title="편집"
                      >
                        <span>편집</span>
                      </button>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePersonaDelete(persona);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 border border-red-300 hover:border-red-400 bg-red-50 hover:bg-red-100 rounded-md transition-all duration-200"
                        title="삭제"
                      >
                        <TrashIcon className="w-4 h-4" />
                        <span>삭제</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'relations' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-black">관계 현황</h3>
              <span className="text-sm text-gray-500">{relations.length}개의 관계</span>
            </div>

            {relations.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
                  💕
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  아직 관계가 형성되지 않았어요
                </h4>
                <p className="text-gray-500 mb-6">
                  AI 캐릭터들과 대화하면서 관계를 발전시켜보세요!
                </p>
                <button 
                  onClick={() => navigate('/chats')}
                  className="bg-black text-white px-8 py-3 rounded-full font-medium hover:bg-gray-800"
                >
                  채팅하러 가기
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {relations.map((relation) => (
                  <div 
                    key={relation.id}
                    className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <Avatar 
                        src={relation.character?.avatarUrl}
                        alt={relation.character?.name}
                        name={relation.character?.name}
                        size="md"
                        fallbackType="emoji"
                      />
                      <div className="flex-1">
                        <h5 className="font-medium text-black text-left">
                          {relation.character?.name || '알 수 없는 캐릭터'}
                        </h5>
                        <p className="text-sm text-gray-500 text-left">
                          {relation.character?.description || '설명 없음'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-3">
                      <FavorabilityGauge 
                        score={relation.score}
                        stage={relation.stage}
                        showDetails={true}
                        size="small"
                        animated={true}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
                      <div className="text-xs text-gray-500">
                        마지막 업데이트: {new Date(relation.updatedAt).toLocaleDateString('ko-KR')}
                      </div>
                      <button
                        onClick={() => {
                          // 해당 캐릭터와의 채팅으로 이동
                          navigate(`/chats?character=${relation.character.id}`);
                        }}
                        className="flex items-center space-x-1 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-800 border border-blue-300 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 rounded-md transition-all duration-200"
                      >
                        <ChatBubbleLeftRightIcon className="w-4 h-4" />
                        <span>대화하기</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Character Creation Modal */}
      {showCharacterCreation && (
        <CharacterCreation
          onClose={handleCharacterCreationClose}
          onComplete={handleCharacterCreationComplete}
        />
      )}

      {/* Character Edit Modal */}
      {showCharacterEdit && selectedCharacter && (
        <CharacterEdit
          characterId={selectedCharacter.id}
          onClose={() => {
            setShowCharacterEdit(false);
            setSelectedCharacter(null);
          }}
          onUpdate={handleCharacterUpdate}
        />
      )}

      {/* Character Detail Modal */}
      {showCharacterDetail && selectedCharacter && (
        <CharacterDetail
          characterId={selectedCharacter.id}
          onClose={() => {
            setShowCharacterDetail(false);
            setSelectedCharacter(null);
          }}
          onEdit={handleCharacterEditFromDetail}
        />
      )}

      {/* Persona Creation Modal */}
      {showPersonaCreation && (
        <PersonaCreation
          onClose={handlePersonaCreationClose}
          onComplete={handlePersonaCreationComplete}
        />
      )}

      {/* Heart Shop Modal */}
      {showHeartShop && (
        <HeartShop
          onClose={() => setShowHeartShop(false)}
          currentHearts={user?.hearts || 0}
          onPurchase={handleHeartPurchase}
        />
      )}

      {/* Persona Edit Modal */}
      {showPersonaEdit && selectedPersona && (
        <PersonaEdit
          personaId={selectedPersona.id}
          onClose={() => {
            setShowPersonaEdit(false);
            setSelectedPersona(null);
          }}
          onUpdate={handlePersonaUpdate}
        />
      )}

      {/* Persona Detail Modal */}
      {showPersonaDetail && selectedPersona && (
        <PersonaDetail
          personaId={selectedPersona.id}
          onClose={() => {
            setShowPersonaDetail(false);
            setSelectedPersona(null);
          }}
          onEdit={handlePersonaEditFromDetail}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <Settings 
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* Persona Selection Modal for Chat */}
      {showPersonaSelection && selectedCharacterForChat && (
        <PersonaSelection
          isOpen={showPersonaSelection}
          onClose={handleClosePersonaSelection}
          characterId={selectedCharacterForChat.id}
          characterName={selectedCharacterForChat.name}
        />
      )}
    </div>
  );
};

export default MyPage; 