import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PersonaManagement = () => {
  const [personas, setPersonas] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPersonas();
  }, []);

  const fetchPersonas = async () => {
    try {
      const response = await axios.get('/api/personas');
      setPersonas(response.data);
    } catch (error) {
      console.error('Error fetching personas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePersona = async (personaId) => {
    if (!window.confirm('정말로 이 페르소나를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await axios.delete(`/api/personas/${personaId}`);
      setPersonas(personas.filter(p => p.id !== personaId));
      alert('페르소나가 삭제되었습니다.');
    } catch (error) {
      console.error('Error deleting persona:', error);
      alert('삭제에 실패했습니다.');
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleCreatePersona = () => {
    navigate('/persona-creation');
  };

  const handleEditPersona = (personaId) => {
    navigate(`/persona-edit/${personaId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
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
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    {persona.avatarUrl ? (
                      <img 
                        src={persona.avatarUrl} 
                        alt={persona.name}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl">👤</span>
                    )}
                  </div>
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
    </div>
  );
};

export default PersonaManagement; 