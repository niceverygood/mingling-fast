import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { personasAPI, chatsAPI } from '../../services/api';
import Avatar from '../../components/Avatar';

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
    console.log('🎭 페르소나 관리 페이지로 이동');
    onClose();
    navigate('/persona-management');
  };

  // 관계 상태 결정 함수
  const getRelationshipStatus = (persona) => {
    // 임시로 랜덤하게 관계 상태 할당 (나중에 실제 데이터로 교체)
    const statuses = [
      { emoji: '😐', text: '초면', hearts: 0 },
      { emoji: '😄', text: '친한 친구', hearts: 450 },
      { emoji: '😊', text: '친구', hearts: 150 },
    ];
    return statuses[Math.floor(Math.random() * statuses.length)];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl max-h-[90vh] overflow-hidden mx-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900">프로필 선택</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            <p className="text-sm text-gray-600 mb-8 leading-relaxed">
              {characterName}와 대화할 프로필을 선택하세요
            </p>

            {/* 멀티프로필 관리 */}
            <button
              onClick={handleManageProfiles}
              className="w-full flex items-center justify-between p-4 bg-gray-50 rounded-xl mb-6 hover:bg-gray-100 transition-colors"
            >
              <div className="text-left">
                <h3 className="text-base font-semibold text-gray-900">멀티프로필</h3>
                <p className="text-sm text-gray-500 mt-1">직업과 기본 정보를 추가 지원합니다</p>
              </div>
              <ChevronRightIcon className="w-5 h-5 text-gray-400 flex-shrink-0" />
            </button>

            {/* 멀티프로필 목록 */}
            <div className="space-y-4 mb-8">
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-500">프로필을 불러오는 중...</p>
                </div>
              ) : personas.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🎭</span>
                  </div>
                  <p className="text-gray-500 mb-4">아직 생성된 프로필이 없습니다.</p>
                  <button
                    onClick={handleManageProfiles}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    첫 프로필 만들기
                  </button>
                </div>
              ) : (
                personas.map((persona) => {
                  const status = getRelationshipStatus(persona);
                  return (
                    <div
                      key={persona.id}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedPersona === persona.id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => setSelectedPersona(persona.id)}
                    >
                      <div className="flex items-start space-x-4">
                        <Avatar 
                          src={persona.avatarUrl}
                          alt={persona.name}
                          name={persona.name}
                          size="lg"
                          fallbackType="initial"
                          className="flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-lg">{persona.name}</h4>
                          <p className="text-sm text-gray-600 mt-1">
                            {persona.age && `${persona.age}세`}
                            {persona.age && persona.job && ' • '}
                            {persona.job || '직업 미설정'}
                          </p>
                          <div className="flex items-center space-x-3 mt-3">
                            <div className="flex items-center space-x-1">
                              <span className="text-lg">{status.emoji}</span>
                              <span className="text-sm font-medium text-gray-700">{status.text}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-sm">❤️</span>
                              <span className="text-sm font-medium text-blue-600">{status.hearts}</span>
                            </div>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedPersona === persona.id
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-gray-300'
                        }`}>
                          {selectedPersona === persona.id && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* 유저 프로필 섹션 */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">유저 프로필</h3>
              <div 
                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedPersona === 'user'
                    ? 'border-blue-500 bg-blue-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedPersona('user')}
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xl text-white">👤</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">기본 사용자</h4>
                    <p className="text-sm text-gray-600 mt-1">기본 프로필</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selectedPersona === 'user'
                      ? 'bg-blue-500 border-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedPersona === 'user' && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fixed Bottom Buttons */}
        <div className="flex-shrink-0 p-6 bg-white border-t border-gray-100">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleStartChat}
              disabled={!selectedPersona}
              className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-colors ${
                selectedPersona
                  ? 'bg-blue-500 text-white hover:bg-blue-600'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              대화 시작하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaSelection; 