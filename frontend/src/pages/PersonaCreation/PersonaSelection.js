import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { personasAPI, chatsAPI } from '../../services/api';

const PersonaSelection = ({ isOpen, onClose, characterId, characterName }) => {
  const [personas, setPersonas] = useState([]);
  const [selectedPersona, setSelectedPersona] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchPersonas();
    }
  }, [isOpen]);

  const fetchPersonas = async () => {
    try {
      setLoading(true);
              const response = await personasAPI.getAll();
      // 응답이 배열인지 확인
      if (Array.isArray(response.data)) {
        setPersonas(response.data);
        if (response.data.length > 0) {
          setSelectedPersona(response.data[0].id);
        }
      } else {
        console.error('Received non-array response:', response.data);
        setPersonas([]);
      }
    } catch (error) {
      console.error('Error fetching personas:', error);
      setPersonas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!selectedPersona) {
      alert('페르소나를 선택해주세요.');
      return;
    }

    try {
              const response = await chatsAPI.create({ 
          characterId,
          personaId: selectedPersona
        });
      
      onClose();
      // 채팅 페이지로 이동
      navigate(`/chat/${response.data.id}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('채팅 시작에 실패했습니다.');
    }
  };

  const handleManageProfiles = () => {
    onClose();
    navigate('/persona-management');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-end">
      <div className="w-full bg-white rounded-t-3xl max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">프로필 선택</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-gray-600 mb-6">
            {characterName}과 대화할 프로필을 선택하세요
          </p>

          {/* 멀티프로필 관리 */}
          <button
            onClick={handleManageProfiles}
            className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-4 hover:bg-gray-100"
          >
            <div>
              <h3 className="text-base font-medium text-gray-900">멀티프로필</h3>
              <p className="text-sm text-gray-500">직업과 기본 정보를 추가 지원합니다</p>
            </div>
            <ChevronRightIcon className="w-5 h-5 text-gray-400" />
          </button>

          {/* 멀티프로필 목록 */}
          <div className="space-y-3 mb-6">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-gray-500">프로필을 불러오는 중...</p>
              </div>
            ) : personas.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 mb-4">아직 생성된 프로필이 없습니다.</p>
                <button
                  onClick={handleManageProfiles}
                  className="text-blue-500 hover:text-blue-600"
                >
                  첫 프로필 만들기
                </button>
              </div>
            ) : (
              personas.map((persona) => (
                <div
                  key={persona.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer ${
                    selectedPersona === persona.id
                      ? 'border-black bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedPersona(persona.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      {persona.avatarUrl ? (
                        <img 
                          src={persona.avatarUrl} 
                          alt={persona.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{persona.name}</h4>
                      <p className="text-sm text-gray-500">
                        {persona.age}세 {persona.job && `, ${persona.job}`}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-lg">😊</span>
                      <span className="text-sm text-green-600 font-medium">기본 신뢰</span>
                      <span className="text-sm text-gray-500">❤️ 100</span>
                    </div>
                    <div className={`w-6 h-6 rounded-full border-2 ${
                      selectedPersona === persona.id
                        ? 'bg-black border-black'
                        : 'border-gray-300'
                    }`}>
                      {selectedPersona === persona.id && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 유저 프로필 섹션 */}
          <div className="mb-6">
            <h3 className="text-base font-medium text-gray-900 mb-3">유저 프로필</h3>
            <div className="flex items-center justify-between p-4 rounded-xl border-2 border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-lg">👤</span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">사용자</h4>
                  <p className="text-sm text-gray-500">기본 프로필</p>
                </div>
              </div>
              <div className={`w-6 h-6 rounded-full border-2 ${
                selectedPersona === 'user'
                  ? 'bg-black border-black'
                  : 'border-gray-300'
              }`}
              onClick={() => setSelectedPersona('user')}
              >
                {selectedPersona === 'user' && (
                  <div className="w-2 h-2 bg-white rounded-full mx-auto mt-1"></div>
                )}
              </div>
            </div>
          </div>

          {/* 취소/채팅하기 버튼 */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-full font-medium hover:bg-gray-200"
            >
              취소
            </button>
            <button
              onClick={handleStartChat}
              disabled={!selectedPersona}
              className={`flex-1 py-3 px-4 rounded-full font-medium ${
                selectedPersona
                  ? 'bg-black text-white hover:bg-gray-800'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              채팅하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaSelection; 