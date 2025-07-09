import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  HeartIcon, 
  GiftIcon, 
  CalendarIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon,
  FireIcon,
  StarIcon,
  TrophyIcon,
  CameraIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartIconSolid, 
  GiftIcon as GiftIconSolid 
} from '@heroicons/react/24/solid';
import Avatar from '../components/Avatar';
import FavorabilityGauge from '../components/FavorabilityGauge';
import { charactersAPI } from '../services/api';
import { 
  getRelationInfo, 
  processSpecialEvent, 
  getMemories, 
  getAchievements,
  SPECIAL_EVENTS,
  getStageInfo,
  getMoodInfo
} from '../services/relationshipAPI';

const RelationshipPage = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [relationInfo, setRelationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('status');
  const [mood, setMood] = useState('happy');
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [memories, setMemories] = useState([]);
  const [achievements, setAchievements] = useState([]);

  useEffect(() => {
    if (characterId) {
      fetchData();
    }
  }, [characterId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 캐릭터 정보 가져오기
      const characterResponse = await charactersAPI.getById(characterId);
      setCharacter(characterResponse.data);
      
      // 관계 정보 가져오기
      const relationResponse = await getRelationInfo(characterId);
      setRelationInfo(relationResponse);
      
      // 감정 상태 설정 (관계 단계에 따라)
      setMood(getMoodByStage(relationResponse.stage));
      
      // 추억과 성취 데이터 가져오기
      try {
        const memoriesData = await getMemories(characterId);
        setMemories(memoriesData);
      } catch (error) {
        console.error('Error fetching memories:', error);
        setMemories([]);
      }

      try {
        const achievementsData = await getAchievements(characterId);
        setAchievements(achievementsData.allAchievements || []);
      } catch (error) {
        console.error('Error fetching achievements:', error);
        setAchievements([]);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getMoodByStage = (stage) => {
    const moods = {
      0: 'neutral',
      1: 'friendly',
      2: 'happy',
      3: 'excited',
      4: 'loving',
      5: 'devoted',
      6: 'blissful'
    };
    return moods[stage] || 'neutral';
  };

  const handleSpecialEvent = async (eventType, deltaScore, description) => {
    try {
      const result = await processSpecialEvent(characterId, eventType, deltaScore, description);
      setRelationInfo(result.relation);
      setMood(getMoodByStage(result.relation.stage));
      setShowEventModal(false);
    } catch (error) {
      console.error('Error processing special event:', error);
    }
  };

  // getStageInfo는 relationshipAPI에서 import됨

  const getMoodEmoji = (mood) => {
    const moodInfo = getMoodInfo(mood);
    return moodInfo.emoji || '😊';
  };

  const specialEvents = Object.values(SPECIAL_EVENTS);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!character || !relationInfo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">캐릭터 정보를 불러올 수 없습니다.</p>
      </div>
    );
  }

  const stageInfo = getStageInfo(relationInfo.stage);

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-pink-500 to-purple-600 text-white">
        <div className="flex items-center justify-between p-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ArrowLeftIcon className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-semibold">관계 관리</h1>
          <button 
            onClick={() => navigate(`/chat/${characterId}`)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChatBubbleLeftRightIcon className="w-6 h-6" />
          </button>
        </div>
        
        {/* Character Info */}
        <div className="flex items-center p-4 pb-6">
          <Avatar 
            src={character.avatarUrl}
            alt={character.name}
            name={character.name}
            size="xl"
            className="mr-4"
          />
          <div className="flex-1">
            <h2 className="text-xl font-bold">{character.name}</h2>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${stageInfo.bgColor} ${stageInfo.color} mt-2`}>
              <span className="mr-1">{getMoodEmoji(mood)}</span>
              {stageInfo.title}
            </div>
            <p className="text-white/80 text-sm mt-1">{stageInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'status' 
              ? 'text-pink-500 border-b-2 border-pink-500' 
              : 'text-gray-500'
          }`}
        >
          현재 상태
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'events' 
              ? 'text-pink-500 border-b-2 border-pink-500' 
              : 'text-gray-500'
          }`}
        >
          특별 활동
        </button>
        <button
          onClick={() => setActiveTab('memories')}
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'memories' 
              ? 'text-pink-500 border-b-2 border-pink-500' 
              : 'text-gray-500'
          }`}
        >
          추억
        </button>
        <button
          onClick={() => setActiveTab('achievements')}
          className={`flex-1 py-3 px-4 text-center font-medium ${
            activeTab === 'achievements' 
              ? 'text-pink-500 border-b-2 border-pink-500' 
              : 'text-gray-500'
          }`}
        >
          성취
        </button>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Favorability Gauge */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-3">호감도 현황</h3>
              <FavorabilityGauge 
                score={relationInfo.score}
                stage={relationInfo.stage}
                showDetails={true}
                size="large"
                animated={true}
              />
            </div>

            {/* Current Mood */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-medium mb-3">현재 기분</h3>
              <div className="flex items-center space-x-3">
                <div className="text-4xl">{getMoodEmoji(mood)}</div>
                <div>
                  <p className="font-medium capitalize">{mood}</p>
                  <p className="text-sm text-gray-500">
                    {mood === 'happy' && '기분이 좋아 보여요!'}
                    {mood === 'excited' && '설레고 있는 것 같아요!'}
                    {mood === 'loving' && '사랑이 넘쳐 보여요!'}
                    {mood === 'neutral' && '평온한 상태예요'}
                    {mood === 'friendly' && '친근한 분위기예요'}
                    {mood === 'devoted' && '깊은 애정을 느끼고 있어요'}
                    {mood === 'blissful' && '행복에 가득 차 있어요'}
                  </p>
                </div>
              </div>
            </div>

            {/* Next Milestone */}
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
              <h3 className="font-medium mb-3">다음 단계까지</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>진행률</span>
                  <span>{relationInfo.progressInStage}/{relationInfo.maxProgressInStage}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(relationInfo.progressInStage / relationInfo.maxProgressInStage) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  {relationInfo.stage < 6 ? 
                    `${getStageInfo(relationInfo.stage + 1).title} 단계까지 ${relationInfo.maxProgressInStage - relationInfo.progressInStage}점 남았어요` :
                    '최고 단계에 도달했어요! 🎉'
                  }
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => navigate(`/chat/${characterId}`)}
                className="flex items-center justify-center space-x-2 bg-pink-500 text-white py-3 px-4 rounded-lg hover:bg-pink-600 transition-colors"
              >
                <ChatBubbleLeftRightIcon className="w-5 h-5" />
                <span className="font-medium">대화하기</span>
              </button>
              <button
                onClick={() => setShowEventModal(true)}
                className="flex items-center justify-center space-x-2 bg-purple-500 text-white py-3 px-4 rounded-lg hover:bg-purple-600 transition-colors"
              >
                <SparklesIcon className="w-5 h-5" />
                <span className="font-medium">특별 활동</span>
              </button>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium mb-2">특별한 활동</h3>
              <p className="text-sm text-gray-500">
                특별한 활동으로 관계를 더욱 발전시켜보세요!
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {specialEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => {
                    setSelectedEvent(event);
                    setShowEventModal(true);
                  }}
                  className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div className="text-2xl mr-3">{event.emoji}</div>
                  <div className="flex-1 text-left">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-500">{event.description}</div>
                  </div>
                  <div className="flex items-center space-x-1 text-red-500">
                    <HeartIconSolid className="w-4 h-4" />
                    <span className="text-sm font-medium">{event.cost}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'memories' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium mb-2">소중한 추억</h3>
              <p className="text-sm text-gray-500">
                함께 만들어온 특별한 순간들이에요
              </p>
            </div>

            <div className="space-y-3">
              {memories.map((memory) => (
                <div key={memory.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{memory.title}</h4>
                    <span className="text-xs text-gray-500">{memory.date}</span>
                  </div>
                  <p className="text-sm text-gray-600">{memory.description}</p>
                  <div className="flex items-center mt-2 text-pink-500">
                    <CameraIcon className="w-4 h-4 mr-1" />
                    <span className="text-xs">추억 보관함</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-lg font-medium mb-2">관계 성취</h3>
              <p className="text-sm text-gray-500">
                관계 발전의 의미 있는 순간들이에요
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              {achievements.map((achievement) => (
                <div 
                  key={achievement.id}
                  className={`flex items-center p-4 rounded-lg ${
                    achievement.unlocked 
                      ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className={`text-2xl mr-3 ${achievement.unlocked ? '' : 'grayscale'}`}>
                    {achievement.icon}
                  </div>
                  <div className="flex-1">
                    <div className={`font-medium ${achievement.unlocked ? 'text-yellow-700' : 'text-gray-400'}`}>
                      {achievement.title}
                    </div>
                    <div className={`text-sm ${achievement.unlocked ? 'text-yellow-600' : 'text-gray-400'}`}>
                      {achievement.description}
                    </div>
                  </div>
                  {achievement.unlocked && (
                    <TrophyIcon className="w-6 h-6 text-yellow-500" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Special Event Modal */}
      {showEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-sm mx-4 p-6">
            <div className="text-center">
              <div className="text-4xl mb-4">{selectedEvent.emoji}</div>
              <h3 className="text-lg font-medium mb-2">{selectedEvent.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{selectedEvent.description}</p>
              
              <div className="flex items-center justify-center space-x-2 mb-6">
                <HeartIconSolid className="w-5 h-5 text-red-500" />
                <span className="font-medium">{selectedEvent.cost} 하트 소모</span>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEventModal(false)}
                  className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={() => handleSpecialEvent(selectedEvent.id, selectedEvent.cost, selectedEvent.title)}
                  className="flex-1 py-2 px-4 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  실행
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipPage; 