import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeftIcon, 
  HeartIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import Avatar from '../components/Avatar';
import RelationshipStageIndicator from '../components/RelationshipStageIndicator';
import { charactersAPI } from '../services/api';
import { 
  getRelationInfo, 
  getStageInfo,
  getMoodInfo
} from '../services/relationshipAPI';
import { useAuth } from '../context/AuthContext';

const RelationshipPage = () => {
  const { characterId } = useParams();
  const navigate = useNavigate();
  const { user: authUser } = useAuth();
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
  const progressPercentage = (relationInfo.score / 1000) * 100;

  return (
    <div className="max-w-md mx-auto min-h-screen bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
      {/* Header */}
      <div className="relative bg-transparent pt-12 pb-4">
        <div className="flex items-center justify-between px-4">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all duration-200"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-bold text-gray-800">
              백준현과 {authUser?.displayName || 'user_14784'}의 이야기
            </h1>
          </div>
          <button className="p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all duration-200">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
            </svg>
          </button>
        </div>
      </div>

      {/* 메인 관계 표시 영역 */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 py-12">
        {/* 캐릭터 아바타들과 하트 */}
        <div className="relative mb-8">
          <div className="flex items-center gap-16">
            {/* 사용자 아바타 */}
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-full shadow-lg border-4 border-white overflow-hidden">
                <Avatar 
                  src={authUser?.photoURL}
                  alt={authUser?.displayName || 'User'}
                  name={authUser?.displayName || 'User'}
                  size="xl"
                  fallbackType="emoji"
                  className="w-full h-full"
                />
              </div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white px-2 py-0.5 rounded-full shadow-sm">
                <span className="text-xs font-medium text-gray-600">아는 사이</span>
              </div>
            </div>

            {/* 중앙 하트 */}
            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                  <HeartIconSolid className="w-6 h-6 text-pink-500" />
                </div>
                {/* 하트 주변 효과 */}
                <div className="absolute inset-0 bg-pink-200 rounded-full animate-pulse opacity-30"></div>
              </div>
            </div>

            {/* 캐릭터 아바타 */}
            <div className="relative">
              <div className="w-20 h-20 bg-white rounded-full shadow-lg border-4 border-white overflow-hidden">
                <Avatar 
                  src={character?.avatarUrl}
                  alt={character?.name}
                  name={character?.name}
                  size="xl"
                  fallbackType="emoji"
                  className="w-full h-full"
                />
              </div>
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 bg-white px-2 py-0.5 rounded-full shadow-sm">
                <span className="text-xs font-medium text-gray-600">{character?.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 관계 상태 텍스트 */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            0일 동안
          </h2>
          <p className="text-lg text-gray-600">
            이야기를 쌓아오고 있어요
          </p>
        </div>

        {/* 기다항 아이콘 */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
            <span className="text-2xl">❤️</span>
          </div>
          <p className="text-center text-sm text-gray-600 mt-2">기다항</p>
        </div>
      </div>

      {/* 하단 진행률 바와 상태 아이콘들 */}
      <div className="bg-white/90 backdrop-blur-sm rounded-t-3xl px-6 py-6 shadow-2xl">
        {/* 호감도 진행률 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">호감도</span>
            <span className="text-sm font-bold text-pink-600">{relationInfo.score} / 20</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-pink-400 to-purple-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, progressPercentage)}%` }}
            ></div>
          </div>
          <p className="text-xs text-gray-500 mt-1">{character?.name}</p>
        </div>

        {/* 상태 아이콘들 */}
        <div className="flex justify-between items-center">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
              <span className="text-lg">👋</span>
            </div>
            <span className="text-xs text-gray-600">{character?.name}</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
              <span className="text-lg">🍯</span>
            </div>
            <span className="text-xs text-gray-600">친구</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
              <span className="text-lg">🍯</span>
            </div>
            <span className="text-xs text-gray-600">썸</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
              <span className="text-lg">❤️</span>
            </div>
            <span className="text-xs text-gray-600">연인</span>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-1">
              <span className="text-lg">🔒</span>
            </div>
            <span className="text-xs text-gray-600">결혼</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationshipPage; 