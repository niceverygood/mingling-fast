import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, PencilIcon } from '@heroicons/react/24/outline';
import { personasAPI } from '../../services/api';
import Avatar from '../../components/Avatar';

const PersonaDetail = ({ personaId, onClose, onEdit }) => {
  const [persona, setPersona] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPersonaData = async () => {
    // personaId 유효성 검사
    if (!personaId) {
      console.error('❌ personaId가 없습니다.');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔍 페르소나 상세 정보 로딩 시작:', personaId);
      
      const response = await personasAPI.getById(personaId);
      setPersona(response.data);
      
      console.log('✅ 페르소나 상세 정보 로딩 성공:', response.data.name);
      setLoading(false);
    } catch (error) {
      console.error('❌ 페르소나 상세 정보 로딩 실패:', error);
      setLoading(false);
      
      // 사용자에게 친화적인 에러 메시지 표시
      let errorMessage = '페르소나 정보를 불러오는데 실패했습니다.';
      
      if (error.response?.status === 404) {
        errorMessage = '페르소나를 찾을 수 없습니다.';
      } else if (error.response?.status >= 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message?.includes('Network Error')) {
        errorMessage = '네트워크 연결을 확인해주세요.';
      }
      
      // 5초 후 자동으로 재시도
      setTimeout(() => {
        console.log('🔄 페르소나 정보 자동 재시도...');
        fetchPersonaData();
      }, 5000);
      
      alert(errorMessage + '\n5초 후 자동으로 재시도됩니다.');
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
        <div className="bg-white rounded-2xl p-8 max-w-sm mx-4">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600 mb-2">페르소나 정보를 불러오는 중...</div>
            <div className="text-sm text-gray-400">잠시만 기다려주세요</div>
          </div>
        </div>
      </div>
    );
  }

  if (!persona) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-sm mx-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-red-500 text-xl">⚠️</span>
            </div>
            <div className="text-gray-600 mb-4">페르소나 정보를 불러올 수 없습니다</div>
            <div className="space-y-2">
              <button
                onClick={fetchPersonaData}
                className="w-full bg-pink-500 text-white py-2 px-4 rounded-lg hover:bg-pink-600 transition-colors"
              >
                다시 시도
              </button>
              <button
                onClick={onClose}
                className="w-full bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 overflow-y-auto">
        <div className="min-h-screen py-4 px-4">
          <div className="bg-white max-w-sm mx-auto rounded-t-2xl min-h-screen">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-4 rounded-t-2xl z-10">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-black">페르소나 상세</h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleEdit}
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  <PencilIcon className="w-5 h-5" />
                </button>
                <button onClick={onClose} className="p-2">
                  <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-4 py-6 space-y-6">
            {/* Profile Section */}
            <div className="text-center">
              <div className="mb-4">
                <Avatar 
                  src={persona.avatarUrl}
                  alt={persona.name}
                  name={persona.name}
                  size="xl"
                  fallbackType="initial"
                  className="mx-auto"
                />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaDetail; 