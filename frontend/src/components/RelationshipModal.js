import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import FavorabilityGauge from './FavorabilityGauge';

const RelationshipModal = ({ isOpen, onClose, relationInfo, characterInfo }) => {
  if (!isOpen || !relationInfo) return null;

  // 다음 단계까지 남은 점수 계산
  const getNextStageInfo = () => {
    const stageThresholds = {
      0: { next: 150, label: '친구 😊' },
      1: { next: 300, label: '썸 전야 😄' },
      2: { next: 500, label: '연인 💕' },
      3: { next: 700, label: '진지한 관계 💖' },
      4: { next: 850, label: '약혼 💍' },
      5: { next: 930, label: '결혼 👑' }
    };
    
    const currentStage = relationInfo.stage;
    if (currentStage >= 6) return null; // 최대 단계
    
    const nextThreshold = stageThresholds[currentStage];
    const pointsNeeded = nextThreshold.next - relationInfo.score;
    
    return {
      nextStageLabel: nextThreshold.label,
      pointsNeeded: Math.max(0, pointsNeeded),
      progressPercentage: ((relationInfo.score / 1000) * 100).toFixed(1)
    };
  };

  const nextStageInfo = getNextStageInfo();

  const getStageInfo = (stage) => {
    const stages = {
      0: { title: '아는 사람', emoji: '👋', description: '서로를 알아가는 중이에요', tip: '일상적인 대화를 통해 서로를 알아가보세요!' },
      1: { title: '친구', emoji: '😊', description: '편안한 친구 사이예요', tip: '더 개인적인 이야기를 나누어보세요!' },
      2: { title: '썸 전야', emoji: '😄', description: '특별한 감정이 싹트고 있어요', tip: '로맨틱한 분위기를 만들어보세요!' },
      3: { title: '연인', emoji: '💕', description: '서로 사랑하는 사이예요', tip: '사랑을 표현하고 데이트를 즐기세요!' },
      4: { title: '진지한 관계', emoji: '💖', description: '깊고 진지한 사랑이에요', tip: '미래를 함께 계획해보세요!' },
      5: { title: '약혼', emoji: '💍', description: '평생을 함께할 약속을 했어요', tip: '결혼 준비를 함께 해보세요!' },
      6: { title: '결혼', emoji: '👑', description: '영원한 사랑을 맹세했어요', tip: '행복한 결혼 생활을 즐기세요!' }
    };
    return stages[stage] || stages[0];
  };

  const currentStage = getStageInfo(relationInfo.stage);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">관계 현황</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Character Info */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-2xl">
              {characterInfo?.name?.[0] || '?'}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                {characterInfo?.name || '캐릭터'}
              </h3>
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-2xl">{currentStage.emoji}</span>
                <span className="text-base font-medium text-gray-700">
                  {currentStage.title}
                </span>
              </div>
            </div>
          </div>

          {/* Current Relationship Status */}
          <div className="mb-6">
            <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">현재 관계</h4>
              <p className="text-gray-600 text-sm mb-3">{currentStage.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">호감도 점수</span>
                <span className="text-lg font-bold text-gray-900">
                  {relationInfo.score}/1000
                </span>
              </div>
            </div>
          </div>

          {/* Favorability Gauge */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <span className="text-sm font-medium text-gray-700">전체 진행률</span>
              <span className="text-sm font-bold text-pink-600">
                {((relationInfo.score / 1000) * 100).toFixed(1)}%
              </span>
            </div>
            <FavorabilityGauge 
              score={relationInfo.score}
              stage={relationInfo.stage}
              maxScore={1000}
              height={12}
              showLabel={false}
            />
          </div>

          {/* Next Stage Info */}
          {nextStageInfo && (
            <div className="mb-6">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">다음 단계</h4>
                <div className="flex justify-between items-center">
                  <span className="text-base font-medium text-gray-900">
                    {nextStageInfo.nextStageLabel}
                  </span>
                  <span className="text-sm font-bold text-pink-600">
                    {nextStageInfo.pointsNeeded}점 남음
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  더 깊은 관계로 발전하려면
                </div>
              </div>
            </div>
          )}

          {/* Relationship Tip */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-lg">💡</span>
              <span className="text-sm font-medium text-gray-700">관계 발전 팁</span>
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              {currentStage.tip}
            </p>
          </div>

          {/* All Stages Progress */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">관계 단계</h4>
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5, 6].map((stage) => {
                const stageInfo = getStageInfo(stage);
                const isCurrentStage = relationInfo.stage === stage;
                const isPastStage = relationInfo.stage > stage;
                
                return (
                  <div
                    key={stage}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      isCurrentStage
                        ? 'bg-pink-100 border border-pink-200'
                        : isPastStage
                        ? 'bg-gray-100'
                        : 'bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{stageInfo.emoji}</span>
                      <span className={`text-sm font-medium ${
                        isCurrentStage ? 'text-pink-700' : 'text-gray-700'
                      }`}>
                        {stageInfo.title}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {isCurrentStage && (
                        <span className="text-xs text-pink-600 font-medium">현재</span>
                      )}
                      {isPastStage && (
                        <span className="text-xs text-gray-500">완료</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RelationshipModal; 