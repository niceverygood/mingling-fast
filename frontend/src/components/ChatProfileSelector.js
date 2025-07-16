import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { personasAPI } from '../services/api';
import Avatar from './Avatar';

const ChatProfileSelector = ({ onClose, onSelect }) => {
  const { user: authUser } = useAuth();
  const [personas, setPersonas] = useState([]);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [selectedProfileType, setSelectedProfileType] = useState('user'); // 'user' or 'persona'

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const response = await personasAPI.getAll();
      if (response.data && Array.isArray(response.data)) {
        setPersonas(response.data);
        // 기본적으로 첫 번째 페르소나 선택 (있다면)
        if (response.data.length > 0) {
          setSelectedProfile(response.data[0]);
          setSelectedProfileType('persona');
        }
      }
    } catch (error) {
      console.error('Error fetching personas:', error);
      setPersonas([]);
    }
  };

  const handleUserProfileSelect = () => {
    setSelectedProfile(authUser);
    setSelectedProfileType('user');
  };

  const handlePersonaSelect = (persona) => {
    setSelectedProfile(persona);
    setSelectedProfileType('persona');
  };

  const handleStartChat = () => {
    if (selectedProfile) {
      onSelect({
        profile: selectedProfile,
        type: selectedProfileType
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm mx-auto overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-white px-6 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900">채팅 프로필</h1>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* 멀티프로필 섹션 */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-2">멀티프로필</h2>
            <p className="text-xs text-gray-500 mb-4">작업과 기본 정보를 추가 지원합니다</p>
            
            {personas.length > 0 ? (
              <div className="space-y-3">
                {personas.map((persona) => (
                  <button
                    key={persona.id}
                    onClick={() => handlePersonaSelect(persona)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                      selectedProfileType === 'persona' && selectedProfile?.id === persona.id
                        ? 'border-purple-300 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Avatar 
                      src={persona.avatarUrl}
                      alt={persona.name}
                      name={persona.name}
                      size="md"
                      className="flex-shrink-0"
                    />
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">{persona.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {persona.appearance || '페르소나'}
                      </p>
                    </div>
                    {selectedProfileType === 'persona' && selectedProfile?.id === persona.id && (
                      <div className="flex-shrink-0">
                        <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">생성된 페르소나가 없습니다</p>
                <p className="text-xs mt-1">페르소나를 만들어보세요!</p>
              </div>
            )}
          </div>

          {/* 유저프로필 섹션 */}
          <div>
            <h2 className="text-sm font-semibold text-gray-900 mb-4">유저프로필</h2>
            
            <button
              onClick={handleUserProfileSelect}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200 ${
                selectedProfileType === 'user'
                  ? 'border-purple-300 bg-purple-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Avatar 
                src={authUser?.photoURL}
                alt={authUser?.displayName || '사용자'}
                name={authUser?.displayName || '사용자'}
                size="md"
                className="flex-shrink-0"
              />
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900">
                  {authUser?.displayName || 'user_144'}
                </p>
                <p className="text-sm text-gray-500">기본 프로필</p>
              </div>
              {selectedProfileType === 'user' && (
                <div className="flex-shrink-0">
                  <div className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="px-6 pb-6">
          <button
            onClick={handleStartChat}
            disabled={!selectedProfile}
            className={`w-full py-4 rounded-2xl font-semibold text-white transition-all duration-200 ${
              selectedProfile
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
                : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            채팅하기
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatProfileSelector; 