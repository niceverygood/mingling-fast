import React, { useState, useEffect } from 'react';
import { ChevronLeftIcon, CameraIcon, PlusIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import CategorySelection from './CategorySelection';
import HashtagSelection from './HashtagSelection';

const CharacterEdit = ({ characterId, onClose, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: 'undisclosed',
    characterType: '',
    hashtags: [],
    avatarUrl: '',
    firstImpression: '',
    basicSetting: '',
    likes: '',
    dislikes: '',
    weapons: [],
    isPublic: true,
    hashtagCode: '',
    isCommercial: false,
    allowBackup: true
  });

  const [showCategorySelection, setShowCategorySelection] = useState(false);
  const [showHashtagSelection, setShowHashtagSelection] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchCharacterData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  const fetchCharacterData = async () => {
    try {
      const response = await axios.get(`/api/characters/${characterId}`);
      const character = response.data;
      setFormData({
        name: character.name || '',
        age: character.age || '',
        gender: character.gender || 'undisclosed',
        characterType: character.characterType || '',
        hashtags: character.hashtags || [],
        avatarUrl: character.avatarUrl || '',
        firstImpression: character.firstImpression || '',
        basicSetting: character.basicSetting || '',
        likes: character.likes || '',
        dislikes: character.dislikes || '',
        weapons: character.weapons || [],
        isPublic: character.isPublic !== false,
        hashtagCode: character.hashtagCode || '',
        isCommercial: character.isCommercial || false,
        allowBackup: character.backupChats !== false
      });
      setLoading(false);
    } catch (error) {
      console.error('Error fetching character:', error);
      alert('캐릭터 정보를 불러오는데 실패했습니다.');
      onClose();
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          alert('파일 크기는 5MB 이하여야 합니다.');
          return;
        }
        const url = URL.createObjectURL(file);
        handleInputChange('avatarUrl', url);
      }
    };
    input.click();
  };

  const handleCategorySelect = (category) => {
    handleInputChange('characterType', category);
    setShowCategorySelection(false);
  };

  const handleHashtagSelect = (selectedHashtags) => {
    handleInputChange('hashtags', selectedHashtags);
    setShowHashtagSelection(false);
  };

  const addWeapon = () => {
    if (formData.weapons.length < 10) {
      setFormData(prev => ({
        ...prev,
        weapons: [...prev.weapons, '']
      }));
    }
  };

  const updateWeapon = (index, value) => {
    const newWeapons = [...formData.weapons];
    newWeapons[index] = value;
    setFormData(prev => ({
      ...prev,
      weapons: newWeapons
    }));
  };

  const removeWeapon = (index) => {
    const newWeapons = formData.weapons.filter((_, i) => i !== index);
    setFormData(prev => ({
      ...prev,
      weapons: newWeapons
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('캐릭터 이름을 입력해주세요.');
      return;
    }

    if (!formData.characterType) {
      alert('캐릭터 카테고리를 선택해주세요.');
      return;
    }

    setSaving(true);
    try {
      const characterData = {
        ...formData,
        hashtagCode: formData.hashtagCode || `#${formData.name}`,
        backupChats: formData.allowBackup
      };

      const response = await axios.put(`/api/characters/${characterId}`, characterData);
      onUpdate(response.data);
      onClose();
    } catch (error) {
      console.error('Error updating character:', error);
      alert('캐릭터 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
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

  return (
    <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
      <div className="max-w-md mx-auto bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <button 
            onClick={onClose}
            className="p-2 -ml-2"
          >
            <ChevronLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-lg font-medium text-black">캐릭터 수정</h1>
          <button 
            onClick={handleSave}
            disabled={saving || !formData.name.trim() || !formData.characterType}
            className={`text-sm font-medium ${
              saving || !formData.name.trim() || !formData.characterType
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
            <div className="flex flex-col items-center">
              <button 
                onClick={handleImageUpload}
                className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mb-3"
              >
                {formData.avatarUrl ? (
                  <img 
                    src={formData.avatarUrl} 
                    alt="프로필" 
                    className="w-20 h-20 rounded-full object-cover"
                  />
                ) : (
                  <CameraIcon className="w-8 h-8 text-pink-500" />
                )}
              </button>
              <span className="text-sm text-gray-600">이미지</span>
              <span className="text-xs text-gray-400">JPG, PNG 파일 (최대 5MB)</span>
            </div>
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
              placeholder="별명을 입력해주세요"
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

          {/* 캐릭터 카테고리 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              캐릭터
            </label>
            <button
              onClick={() => setShowCategorySelection(true)}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 flex items-center justify-between"
            >
              <span className={formData.characterType ? 'text-black' : 'text-gray-400'}>
                {formData.characterType || '카테고리를 선택해주세요'}
              </span>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* 해시태그 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              해시태그
            </label>
            <button
              onClick={() => setShowHashtagSelection(true)}
              className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50 flex items-center justify-between"
            >
              <span className={formData.hashtags.length > 0 ? 'text-black' : 'text-gray-400'}>
                {formData.hashtags.length > 0 
                  ? `${formData.hashtags.length}개 선택됨`
                  : '해시태그를 선택해주세요'
                }
              </span>
              <ChevronRightIcon className="w-5 h-5 text-gray-400" />
            </button>
            {formData.hashtags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {formData.hashtags.map((tag, index) => (
                  <span 
                    key={index}
                    className="px-2 py-1 bg-pink-100 text-pink-600 text-xs rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 캐릭터 첫인상 설정 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              캐릭터 첫인상 설정
            </label>
            <div className="text-right text-xs text-gray-400 mb-2">
              {formData.firstImpression.length}/300
            </div>
            <textarea
              value={formData.firstImpression}
              onChange={(e) => handleInputChange('firstImpression', e.target.value)}
              placeholder="대화 시작 시 AI 캐릭터가 먼저 할 말을 입력해주세요"
              className="w-full h-24 p-3 border border-gray-200 rounded-lg resize-none text-sm bg-gray-50"
              maxLength={300}
            />
          </div>

          {/* 캐릭터 기본 설정 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              캐릭터 기본 설정
            </label>
            <div className="text-right text-xs text-gray-400 mb-2">
              {formData.basicSetting.length}/700
            </div>
            <textarea
              value={formData.basicSetting}
              onChange={(e) => handleInputChange('basicSetting', e.target.value)}
              placeholder="배경, 성격, MBTI, 키 등을 입력해주세요"
              className="w-full h-32 p-3 border border-gray-200 rounded-lg resize-none text-sm bg-gray-50"
              maxLength={700}
            />
          </div>

          {/* 좋아하는 것 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              좋아하는 것 (선택)
            </label>
            <div className="text-right text-xs text-gray-400 mb-2">
              {formData.likes.length}/50
            </div>
            <input
              type="text"
              value={formData.likes}
              onChange={(e) => handleInputChange('likes', e.target.value)}
              placeholder="캐릭터가 좋아하는 것을 입력해주세요"
              className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50"
              maxLength={50}
            />
          </div>

          {/* 싫어하는 것 */}
          <div>
            <label className="block text-sm text-gray-600 mb-2">
              싫어하는 것 (선택)
            </label>
            <div className="text-right text-xs text-gray-400 mb-2">
              {formData.dislikes.length}/50
            </div>
            <input
              type="text"
              value={formData.dislikes}
              onChange={(e) => handleInputChange('dislikes', e.target.value)}
              placeholder="캐릭터가 싫어하는 것을 입력해주세요"
              className="w-full p-3 border border-gray-200 rounded-lg text-sm bg-gray-50"
              maxLength={50}
            />
          </div>

          {/* 부가 정보 추가 */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm text-gray-600">
                부가 정보 추가 ({formData.weapons.length}/10)
              </label>
              <button
                onClick={addWeapon}
                disabled={formData.weapons.length >= 10}
                className="flex items-center space-x-1 text-sm text-gray-600 disabled:text-gray-300"
              >
                <PlusIcon className="w-4 h-4" />
                <span>추가</span>
              </button>
            </div>
            
            {formData.weapons.length === 0 ? (
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                <button
                  onClick={addWeapon}
                  className="flex items-center space-x-1 text-gray-500 mx-auto"
                >
                  <PlusIcon className="w-4 h-4" />
                  <span className="text-sm">부가 정보 추가 (0/10)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {formData.weapons.map((weapon, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={weapon}
                      onChange={(e) => updateWeapon(index, e.target.value)}
                      placeholder="부가 정보를 입력해주세요"
                      className="flex-1 p-2 border border-gray-200 rounded text-sm"
                    />
                    <button
                      onClick={() => removeWeapon(index)}
                      className="text-red-500 text-sm"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 게시 범위 설정 */}
          <div>
            <h3 className="text-base font-medium text-black mb-3">게시 범위 설정</h3>
            <div className="flex space-x-6">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPublic"
                  value="true"
                  checked={formData.isPublic === true}
                  onChange={(e) => handleInputChange('isPublic', true)}
                  className="mr-2 accent-black"
                />
                <span className="text-sm text-gray-700">공개</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="isPublic"
                  value="false"
                  checked={formData.isPublic === false}
                  onChange={(e) => handleInputChange('isPublic', false)}
                  className="mr-2 accent-black"
                />
                <span className="text-sm text-gray-700">비공개</span>
              </label>
            </div>
          </div>

          {/* 저장 버튼 */}
          <div className="pt-6">
            <button
              onClick={handleSave}
              disabled={saving || !formData.name.trim() || !formData.characterType}
              className={`w-full py-4 rounded-xl font-medium ${
                saving || !formData.name.trim() || !formData.characterType
                  ? 'bg-gray-200 text-gray-400'
                  : 'bg-pink-500 text-white'
              }`}
            >
              {saving ? '저장 중...' : '저장'}
            </button>
          </div>
        </div>
      </div>

      {/* Category Selection Modal */}
      {showCategorySelection && (
        <CategorySelection
          onClose={() => setShowCategorySelection(false)}
          onSelect={handleCategorySelect}
          selectedCategory={formData.characterType}
        />
      )}

      {/* Hashtag Selection Modal */}
      {showHashtagSelection && (
        <HashtagSelection
          onClose={() => setShowHashtagSelection(false)}
          onSelect={handleHashtagSelect}
          selectedHashtags={formData.hashtags}
        />
      )}
    </div>
  );
};

export default CharacterEdit; 