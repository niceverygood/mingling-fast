import React, { useState } from 'react';
import { ChevronLeftIcon } from '@heroicons/react/24/outline';

const HashtagSelection = ({ onClose, onSelect, selectedHashtags = [] }) => {
  const [tempSelected, setTempSelected] = useState([...selectedHashtags]);

  const hashtagCategories = {
    '성격': [
      '친근한', '따뜻한', '차분한', '활발한', '유머러스한', 
      '진지한', '귀여운', '섹시한', '지적인', '감성적인'
    ],
    '관계': [
      '연인', '친구', '멘토', '상담사', '선생님', 
      '동료', '기죽', '코치'
    ],
    '취미': [
      '독서', '영화', '음악', '게임', '운동', 
      '여행', '그림', '술'
    ],
    '직업': [
      '의사', '교사', '개발자', '배우', '가수', 
      '운동선수', '변호사'
    ],
    '특징': [
      '로맨틱', '현실적', '이상적', '논리적', 
      '감정적', '치유적', '본능적'
    ]
  };

  const toggleHashtag = (hashtag) => {
    if (tempSelected.includes(hashtag)) {
      setTempSelected(tempSelected.filter(h => h !== hashtag));
    } else {
      setTempSelected([...tempSelected, hashtag]);
    }
  };

  const handleComplete = () => {
    onSelect(tempSelected);
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
          <h1 className="text-lg font-medium text-black">해시태그 선택</h1>
          <button 
            onClick={handleComplete}
            className="text-sm font-medium text-pink-500"
          >
            완료
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6 pb-32">
          {Object.entries(hashtagCategories).map(([category, hashtags]) => (
            <div key={category}>
              <h3 className="text-lg font-medium text-black mb-4">{category}</h3>
              <div className="grid grid-cols-2 gap-3">
                {hashtags.map((hashtag, index) => (
                  <button
                    key={index}
                    onClick={() => toggleHashtag(hashtag)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-colors ${
                      tempSelected.includes(hashtag)
                        ? 'bg-pink-100 border-pink-200 text-pink-600'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    #{hashtag}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HashtagSelection; 