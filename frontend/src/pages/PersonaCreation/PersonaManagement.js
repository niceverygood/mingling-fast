import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { personasAPI } from '../../services/api';
import PersonaCreation from './PersonaCreation';
import PersonaEdit from './PersonaEdit';
import Avatar from '../../components/Avatar';

const PersonaManagement = () => {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPersonaId, setSelectedPersonaId] = useState(null);

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
              const response = await personasAPI.getAll();
      // 응답이 배열인지 확인
      if (Array.isArray(response.data)) {
        setPersonas(response.data);
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

  const handleDeletePersona = async (personaId) => {
    if (!window.confirm('정말로 이 페르소나를 삭제하시겠습니까?')) {
      return;
    }

    try {
              await personasAPI.delete(personaId);
      setPersonas(personas.filter(p => p.id !== personaId));
      alert('페르소나가 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting persona:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleBack = () => {
    window.history.back();
  };

  const handleCreatePersona = () => {
    setShowCreateModal(true);
  };

  const handleEditPersona = (personaId) => {
    setSelectedPersonaId(personaId);
    setShowEditModal(true);
  };

  const handlePersonaCreated = (newPersona) => {
    setPersonas([...personas, newPersona]);
    setShowCreateModal(false);
  };

  const handlePersonaUpdated = (updatedPersona) => {
    setPersonas(personas.map(p => p.id === updatedPersona.id ? updatedPersona : p));
    setShowEditModal(false);
    setSelectedPersonaId(null);
  };

  return (
    <div className="max-w-sm mx-auto min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">멀티프로필 관리</h1>
        </div>
        <button className="text-red-500 hover:text-red-600 font-medium">
          완료
        </button>
      </div>

      <div className="p-4">
        {/* 새 멀티프로필 만들기 */}
        <button
          onClick={handleCreatePersona}
          className="w-full flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 mb-6"
        >
          <div className="text-center">
            <PlusIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <span className="text-gray-600 font-medium">새 멀티프로필 만들기</span>
          </div>
        </button>

        {/* 페르소나 목록 */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">프로필을 불러오는 중...</p>
          </div>
        ) : personas.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">아직 생성된 프로필이 없습니다.</p>
            <button
              onClick={handleCreatePersona}
              className="text-blue-500 hover:text-blue-600 font-medium"
            >
              첫 프로필 만들기
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {personas.map((persona) => (
              <div
                key={persona.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm"
              >
                <div className="flex items-center space-x-3">
                  <Avatar 
                    src={persona.avatarUrl}
                    alt={persona.name}
                    name={persona.name}
                    size="lg"
                    fallbackType="initial"
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900 text-lg">{persona.name}</h3>
                    <p className="text-gray-500">
                      나이: {persona.age || '미설정'}
                    </p>
                    <p className="text-gray-500">
                      직업: {persona.job || '미설정'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleEditPersona(persona.id)}
                    className="p-2 hover:bg-gray-100 rounded-full"
                    title="편집"
                  >
                    <PencilIcon className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleDeletePersona(persona.id)}
                    className="p-2 hover:bg-red-100 rounded-full"
                    title="삭제"
                  >
                    <TrashIcon className="w-5 h-5 text-red-600" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 페르소나 생성 모달 */}
      {showCreateModal && (
        <PersonaCreation
          onClose={() => setShowCreateModal(false)}
          onComplete={handlePersonaCreated}
        />
      )}

      {/* 페르소나 편집 모달 */}
      {showEditModal && selectedPersonaId && (
        <PersonaEdit
          personaId={selectedPersonaId}
          onClose={() => {
            setShowEditModal(false);
            setSelectedPersonaId(null);
          }}
          onUpdate={handlePersonaUpdated}
        />
      )}
    </div>
  );
};

export default PersonaManagement; 