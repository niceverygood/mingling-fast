import React, { useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const CategorySelection = ({ onClose, onSelect, selectedCategory }) => {
  const [tempSelected, setTempSelected] = useState(selectedCategory || '');

  const categories = [
    '애니메이션 & 만화 주인공',
    '게임 캐릭터',
    '순수창작 캐릭터',
    '셀럽브리티',
    '영화 & 드라마 주인공',
    '버튜버',
    '기타'
  ];

  const handleComplete = () => {
    if (tempSelected) {
      onSelect(tempSelected);
    }
  };

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
          <h1 className="text-lg font-medium text-black">더보기</h1>
          <button 
            onClick={handleComplete}
            disabled={!tempSelected}
            className={`text-sm font-medium ${
              !tempSelected ? 'text-gray-300' : 'text-pink-500'
            }`}
          >
            완료
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-lg text-center text-black mb-8">
            카테고리를 선택해주세요.
          </p>

          <div className="space-y-3">
            {categories.map((category, index) => (
              <button
                key={index}
                onClick={() => setTempSelected(category)}
                className={`w-full p-4 rounded-full border text-sm font-medium transition-colors ${
                  tempSelected === category
                    ? 'bg-pink-100 border-pink-200 text-pink-600'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CategorySelection; 