import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { personasAPI } from '../../services/api';

const PersonaDetail = ({ personaId, onClose, onEdit }) => {
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPersonaData = async () => {
    try {
      const response = await personasAPI.getById(personaId);
      setPersona(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching persona:', error);
      alert('페르소나 정보를 불러오는데 실패했습니다.');
      onClose();
    }
  };

  useEffect(() => {
    fetchPersonaData();
  }, []);

  const handleEdit = () => {
    onEdit(persona);
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8">
          <div className="text-gray-500">페르소나 정보를 불러오는 중...</div>
        </div>
      </div>
    );
  }

  if (!persona) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-sm w-full rounded-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-black">페르소나 상세</h2>
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
              <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {persona.avatarUrl ? (
                  <img 
                    src={persona.avatarUrl} 
                    alt={persona.name} 
                    className="w-24 h-24 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-pink-500 text-3xl font-bold">
                    {persona.name?.charAt(0)}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-black mb-2">{persona.name}</h3>
              <div className="flex items-center justify-center space-x-2 text-gray-600">
                {persona.age && <span>{persona.age}세</span>}
                {persona.age && persona.gender && <span>•</span>}
                {persona.gender && (
                  <span>
                    {persona.gender === 'male' ? '남성' : 
                     persona.gender === 'female' ? '여성' : '성별 비공개'}
                  </span>
                )}
              </div>
              {persona.job && (
                <p className="text-gray-500 mt-1">{persona.job}</p>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              {persona.basicInfo && (
                <div>
                  <h4 className="text-lg font-medium text-black mb-3">기본 정보</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{persona.basicInfo}</p>
                  </div>
                </div>
              )}

              {persona.habits && (
                <div>
                  <h4 className="text-lg font-medium text-black mb-3">습관</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{persona.habits}</p>
                  </div>
                </div>
              )}

              {persona.appearance && (
                <div>
                  <h4 className="text-lg font-medium text-black mb-3">외모</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{persona.appearance}</p>
                  </div>
                </div>
              )}

              {persona.personality && (
                <div>
                  <h4 className="text-lg font-medium text-black mb-3">성격</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{persona.personality}</p>
                  </div>
                </div>
              )}

              {!persona.basicInfo && !persona.habits && !persona.appearance && !persona.personality && (
                <div className="text-center py-8">
                  <p className="text-gray-500">추가 정보가 없습니다.</p>
                  <button 
                    onClick={handleEdit}
                    className="mt-4 text-pink-500 hover:text-pink-600 font-medium"
                  >
                    정보 추가하기
                  </button>
                </div>
              )}
            </div>

            {/* Meta Info */}
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400">
                생성일: {new Date(persona.createdAt).toLocaleDateString('ko-KR')}
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

export default PersonaDetail; 