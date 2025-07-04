import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';
import { personasAPI } from '../../services/api';
import ImageUpload from '../../components/ImageUpload';

const PersonaEdit = ({ personaId, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'undisclosed',
    job: '',
    avatarUrl: '',
    basicInfo: '',
    habits: ''
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPersonaData = useCallback(async () => {
    try {
              const response = await personasAPI.getById(personaId);
        const persona = response.data;
      setFormData({
        name: persona.name || '',
        age: persona.age || '',
        gender: persona.gender || 'undisclosed',
        job: persona.job || '',
        avatarUrl: persona.avatarUrl || '',
        basicInfo: persona.basicInfo || '',
        habits: persona.habits || ''
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching persona:', error);
      alert('페르소나 정보를 불러오는데 실패했습니다.');
      onClose();
    }
  }, [personaId, onClose]);

  useEffect(() => {
    fetchPersonaData();
  }, [fetchPersonaData]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUploadSuccess = (uploadData) => {
    if (uploadData && uploadData.url) {
      handleInputChange('avatarUrl', uploadData.url);
    } else {
      handleInputChange('avatarUrl', '');
    }
  };

  const handleImageUploadError = (error) => {
    console.error('Image upload error:', error);
  };

  const handleSave = async () => {
    // 이름은 필수
    if (!formData.name.trim()) {
      alert('이름을 입력해주세요.');
      return;
    }

    setSaving(true);
    try {
              const response = await personasAPI.update(personaId, formData);
        onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating persona:', error);
      alert('페르소나 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-sm mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <button 
            onClick={onClose}
            className="p-2 -ml-2"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-medium text-black">페르소나 수정</h1>
          <button 
            onClick={handleSave}
            disabled={saving || !formData.name.trim()}
            className={`text-sm font-medium ${
              saving || !formData.name.trim()
                ? 'text-gray-300'
                : 'text-pink-500'
            }`}
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 pb-32">
          {/* 프로필 이미지 */}
          <div>
            <h3 className="text-base font-medium text-black mb-3">프로필 이미지</h3>
            <ImageUpload
              type="persona"
              currentImage={formData.avatarUrl}
              onUploadSuccess={handleImageUploadSuccess}
              onUploadError={handleImageUploadError}
              maxSize={2}
              placeholder="페르소나 프로필 이미지를 업로드하세요"
              className="w-full"
            />
          </div>

          {/* 성별 */}
          <div>
            <h3 className="text-base font-medium text-black mb-3">성별</h3>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={formData.gender === 'male'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="mr-2 accent-black"
                />
                <span className="text-sm text-gray-700">남성</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={formData.gender === 'female'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="mr-2 accent-black"
                />
                <span className="text-sm text-gray-700">여성</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  value="undisclosed"
                  checked={formData.gender === 'undisclosed'}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="mr-2 accent-black"
                />
                <span className="text-sm text-gray-700">밝히지 않음</span>
              </label>
            </div>
          </div>

          {/* 이름 (필수) */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              이름 (필수)
            </label>
            <div className="text-right text-xs text-gray-400 mb-2">
              {formData.name.length}/15
            </div>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="이름을 입력해주세요"
              className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50"
              maxLength={15}
              required
            />
          </div>

          {/* 나이 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              나이
            </label>
            <div className="text-right text-xs text-gray-400 mb-2">
              {formData.age.length}/15
            </div>
            <input
              type="text"
              value={formData.age}
              onChange={(e) => handleInputChange('age', e.target.value)}
              placeholder="나이를 입력해주세요"
              className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50"
              maxLength={15}
            />
          </div>

          {/* 직업 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              직업
            </label>
            <div className="text-right text-xs text-gray-400 mb-2">
              {formData.job.length}/15
            </div>
            <input
              type="text"
              value={formData.job}
              onChange={(e) => handleInputChange('job', e.target.value)}
              placeholder="직업을 입력해주세요"
              className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50"
              maxLength={15}
            />
          </div>

          {/* 기본 정보 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              기본 정보
            </label>
            <div className="text-right text-xs text-gray-400 mb-2">
              {formData.basicInfo.length}/500
            </div>
            <textarea
              value={formData.basicInfo}
              onChange={(e) => handleInputChange('basicInfo', e.target.value)}
              placeholder="성격, 취미 등 기본 특성을 입력해주세요"
              className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none text-sm bg-gray-50"
              maxLength={500}
            />
          </div>

          {/* 습관적인말과 행동 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              습관적인말과 행동
            </label>
            <div className="text-right text-xs text-gray-400 mb-2">
              {formData.habits.length}/500
            </div>
            <textarea
              value={formData.habits}
              onChange={(e) => handleInputChange('habits', e.target.value)}
              placeholder="자주 사용하는 말씀, 행동 패턴 등을 입력해주세요"
              className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none text-sm bg-gray-50"
              maxLength={500}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PersonaEdit; 