import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import FavorabilityGauge, { FavorabilityChangeNotification } from '../components/FavorabilityGauge';
import { getRelationInfo, processSpecialEvent, SPECIAL_EVENTS } from '../services/favorabilityAPI';
import { charactersAPI } from '../services/api';

const TestFavorability = () => {
  const navigate = useNavigate();
  const [characters, setCharacters] = useState([]);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [relationInfo, setRelationInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchCharacters();
  }, []);

  const fetchCharacters = async () => {
    try {
      const response = await charactersAPI.getAll();
      if (Array.isArray(response.data)) {
        setCharacters(response.data.slice(0, 10)); // 처음 10개만
      }
    } catch (error) {
      console.error('Error fetching characters:', error);
    }
  };

  const handleCharacterSelect = async (character) => {
    setSelectedCharacter(character);
    setLoading(true);
    
    try {
      const relationData = await getRelationInfo(character.id);
      setRelationInfo(relationData);
    } catch (error) {
      console.error('Error fetching relation info:', error);
      // 기본값 설정
      setRelationInfo({
        score: 0,
        stage: 0,
        stageChanged: false
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSpecialEvent = async (eventKey) => {
    if (!selectedCharacter) return;

    const event = SPECIAL_EVENTS[eventKey];
    setLoading(true);

    try {
      const result = await processSpecialEvent(
        selectedCharacter.id,
        event.type,
        event.deltaScore,
        event.description
      );

      setRelationInfo(result.relation);

      // 알림 표시
      setNotification({
        deltaScore: result.deltaScore,
        oldStage: result.oldStage,
        newStage: result.relation.stage,
        stageChanged: result.stageChanged
      });

      // 3초 후 알림 제거
      setTimeout(() => {
        setNotification(null);
      }, 3000);

    } catch (error) {
      console.error('Error processing special event:', error);
      alert('이벤트 처리 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => navigate('/chats')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold">호감도 시스템 테스트</h1>
        </div>
      </div>

      {/* Character Selection */}
      <div className="p-4">
        <h2 className="text-lg font-medium mb-3">캐릭터 선택</h2>
        <div className="grid grid-cols-2 gap-2 mb-6">
          {characters.map((character) => (
            <button
              key={character.id}
              onClick={() => handleCharacterSelect(character)}
              className={`p-3 rounded-lg border text-left transition-colors ${
                selectedCharacter?.id === character.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="font-medium text-sm">{character.name}</div>
              <div className="text-xs text-gray-500 truncate">{character.description}</div>
            </button>
          ))}
        </div>

        {/* Relation Info */}
        {selectedCharacter && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">
              {selectedCharacter.name}와의 관계
            </h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                <p className="text-sm text-gray-500">로딩 중...</p>
              </div>
            ) : relationInfo ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <FavorabilityGauge 
                  score={relationInfo.score}
                  stage={relationInfo.stage}
                  showDetails={true}
                  size="normal"
                  animated={true}
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Special Events */}
        {selectedCharacter && relationInfo && (
          <div>
            <h3 className="text-lg font-medium mb-3">특별 이벤트</h3>
            
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-green-600 mb-2">긍정적 이벤트</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSpecialEvent('GIFT_FLOWER')}
                    disabled={loading}
                    className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 hover:bg-green-100 disabled:opacity-50"
                  >
                    🌹 꽃 선물 (+25)
                  </button>
                  <button
                    onClick={() => handleSpecialEvent('GIFT_CHOCOLATE')}
                    disabled={loading}
                    className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 hover:bg-green-100 disabled:opacity-50"
                  >
                    🍫 초콜릿 (+20)
                  </button>
                  <button
                    onClick={() => handleSpecialEvent('DATE_CAFE')}
                    disabled={loading}
                    className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 hover:bg-green-100 disabled:opacity-50"
                  >
                    ☕ 카페 데이트 (+30)
                  </button>
                  <button
                    onClick={() => handleSpecialEvent('DATE_MOVIE')}
                    disabled={loading}
                    className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 hover:bg-green-100 disabled:opacity-50"
                  >
                    🎬 영화 데이트 (+35)
                  </button>
                  <button
                    onClick={() => handleSpecialEvent('CONFESSION')}
                    disabled={loading}
                    className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 hover:bg-green-100 disabled:opacity-50"
                  >
                    💕 고백 (+60)
                  </button>
                  <button
                    onClick={() => handleSpecialEvent('PROPOSAL')}
                    disabled={loading}
                    className="p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700 hover:bg-green-100 disabled:opacity-50"
                  >
                    💍 프로포즈 (+100)
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-red-600 mb-2">부정적 이벤트</h4>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSpecialEvent('CONFLICT_MINOR')}
                    disabled={loading}
                    className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    😤 작은 갈등 (-15)
                  </button>
                  <button
                    onClick={() => handleSpecialEvent('CONFLICT_MAJOR')}
                    disabled={loading}
                    className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    💥 큰 갈등 (-40)
                  </button>
                  <button
                    onClick={() => handleSpecialEvent('BETRAYAL')}
                    disabled={loading}
                    className="p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700 hover:bg-red-100 disabled:opacity-50"
                  >
                    💔 배신 (-80)
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-800 mb-2">💡 테스트 가이드</h4>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• 이벤트를 클릭하면 호감도가 변화합니다</li>
                <li>• 단계가 바뀔 때마다 알림이 표시됩니다</li>
                <li>• 실제 채팅에서도 AI가 자동으로 호감도를 평가합니다</li>
                <li>• 총 7단계: 아는 사람 → 친구 → 썸 → 연인 → 진지한 관계 → 약혼 → 결혼</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <FavorabilityChangeNotification
          deltaScore={notification.deltaScore}
          oldStage={notification.oldStage}
          newStage={notification.newStage}
          stageChanged={notification.stageChanged}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
};

export default TestFavorability; 