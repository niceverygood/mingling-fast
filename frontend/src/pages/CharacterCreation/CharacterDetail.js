import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, PencilIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { charactersAPI } from '../../services/api';
import PersonaSelection from '../PersonaCreation/PersonaSelection';

const CharacterDetail = ({ characterId, onClose, onEdit }) => {
  const [character, setCharacter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCharacterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  const fetchCharacterData = async () => {
    try {
      const response = await charactersAPI.getById(characterId);
      setCharacter(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching character:', error);
      alert('캐릭터 정보를 불러오는데 실패했습니다.');
      onClose();
    }
  };

  const handleEdit = () => {
    onEdit(character);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="text-gray-500">캐릭터 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!character) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-black">캐릭터 상세</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleEdit}
              className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose} 
              className="p-2 text-gray-600 hover:text-gray-800 rounded-full hover:bg-gray-100"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Profile Section */}
            <div className="text-center">
              <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {character.avatarUrl ? (
                  <img 
                    src={character.avatarUrl} 
                    alt={character.name} 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-blue-500 text-3xl font-bold">
                    {character.name?.charAt(0)}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">{character.name}</h3>
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                {character.age && <span>{character.age}세</span>}
                {character.age && character.gender && <span>•</span>}
                {character.gender && (
                  <span>
                    {character.gender === 'male' ? '남성' : 
                     character.gender === 'female' ? '여성' : '성별 비공개'}
                  </span>
                )}
              </div>
              {character.characterType && (
                <p className="text-gray-500 mt-1">{character.characterType}</p>
              )}
              {character.description && (
                <p className="text-gray-600 mt-2 text-sm">{character.description}</p>
              )}
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              {character.mbti && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">MBTI</p>
                  <p className="font-medium text-black">{character.mbti}</p>
                </div>
              )}
              {character.height && (
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-xs text-gray-500 mb-1">키</p>
                  <p className="font-medium text-black">{character.height}</p>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              {character.firstImpression && (
                <div>
                  <h4 className="text-lg font-medium text-black mb-3">첫인상</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{character.firstImpression}</p>
                  </div>
                </div>
              )}

              {character.basicSetting && (
                <div>
                  <h4 className="text-lg font-medium text-black mb-3">기본 설정</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{character.basicSetting}</p>
                  </div>
                </div>
              )}

              {character.personality && (
                <div>
                  <h4 className="text-lg font-medium text-black mb-3">성격</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{character.personality}</p>
                  </div>
                </div>
              )}

              {character.background && (
                <div>
                  <h4 className="text-lg font-medium text-black mb-3">배경 설정</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{character.background}</p>
                  </div>
                </div>
              )}

              {character.likes && (
                <div>
                  <h4 className="text-lg font-medium text-black mb-3">좋아하는 것</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{character.likes}</p>
                  </div>
                </div>
              )}

              {character.dislikes && (
                <div>
                  <h4 className="text-lg font-medium text-black mb-3">싫어하는 것</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{character.dislikes}</p>
                  </div>
                </div>
              )}

              {character.hashtags && character.hashtags.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-black mb-3">해시태그</h4>
                  <div className="flex flex-wrap gap-2">
                    {character.hashtags.map((tag, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-600 text-sm rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {character.weapons && character.weapons.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-black mb-3">부가 정보</h4>
                  <div className="space-y-2">
                    {character.weapons.map((weapon, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-3">
                        <p className="text-gray-700">{weapon}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!character.personality && !character.background && !character.likes && !character.dislikes && !character.firstImpression && !character.basicSetting && (
                <div className="text-center py-8">
                  <p className="text-gray-500">추가 정보가 없습니다.</p>
                  <button 
                    onClick={handleEdit}
                    className="mt-4 text-blue-500 hover:text-blue-600 font-medium"
                  >
                    정보 추가하기
                  </button>
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex space-x-4 text-xs text-gray-500">
                <span>공개 설정: {character.isPublic ? '공개' : '비공개'}</span>
                <span>채팅 백업: {character.backupChats ? 'Y' : 'N'}</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                생성일: {new Date(character.createdAt).toLocaleDateString('ko-KR')}
              </p>
            </div>

            {/* 하단 여백 */}
            <div className="h-4"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterDetail; 