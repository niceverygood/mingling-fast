import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import Avatar from '../components/Avatar';
import RelationshipStageIndicator from '../components/RelationshipStageIndicator';
import { charactersAPI } from '../services/api';
import { 
  getRelationInfo, 
  getStageInfo,
  getMoodInfo
} from '../services/relationshipAPI';

const RelationshipPage = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const [character, setCharacter] = useState(null);
  const [relationInfo, setRelationInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mood, setMood] = useState('happy');

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

  const getMoodEmoji = (mood) => {
    const moodInfo = getMoodInfo(mood);
    return moodInfo.emoji || '😊';
  };

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

      {/* 현재 상태 내용 */}
      <div className="p-4">
        <div className="space-y-6">
          {/* Relationship Stage Indicator */}
          <div className="bg-white rounded-lg shadow-sm border p-4">
            <RelationshipStageIndicator 
              score={relationInfo.score}
              stage={relationInfo.stage}
              showDetails={true}
              size="normal"
              showAdvice={true}
              showAllStages={false}
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
        </div>
      </div>
    </div>
  );
};

export default RelationshipPage; 