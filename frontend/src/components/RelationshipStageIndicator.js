import React from 'react';
import { 
  getStageInfo, 
  getNextStageInfo, 
  calculateStageProgress, 
  calculateTotalProgress, 
  getPointsToNextStage,
  getRelationshipAdvice,
  getRecommendedEvents,
  RELATIONSHIP_STAGES
} from '../utils/relationshipUtils';

const RelationshipStageIndicator = ({ 
  score = 0, 
  stage = 0, 
  showDetails = true, 
  size = 'normal',
  showAdvice = false,
  showAllStages = false
}) => {
  const stageInfo = getStageInfo(stage);
  const nextStageInfo = getNextStageInfo(stage);
  const stageProgress = calculateStageProgress(score, stage);
  const totalProgress = calculateTotalProgress(score);
  const pointsNeeded = getPointsToNextStage(score, stage);
  const advice = getRelationshipAdvice(score, stage);
  const recommendedEvents = getRecommendedEvents(stage);

  const sizeClasses = {
    small: 'text-sm',
    normal: 'text-base',
    large: 'text-lg'
  };

  const iconSizes = {
    small: 'text-xl',
    normal: 'text-2xl',
    large: 'text-3xl'
  };

  return (
    <div className="relationship-stage-indicator">
      {/* 현재 단계 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={iconSizes[size]}>{stageInfo.emoji}</div>
          <div>
            <h3 className={`font-semibold ${sizeClasses[size]}`} style={{ color: stageInfo.color }}>
              {stageInfo.title}
            </h3>
            <p className={`text-gray-600 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
              {stageInfo.description}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold ${sizeClasses[size]}`} style={{ color: stageInfo.color }}>
            {score}
          </div>
          <div className={`text-gray-500 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
            / 1000
          </div>
        </div>
      </div>

      {/* 전체 진행률 */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className={`text-gray-700 font-medium ${sizeClasses[size]}`}>
            전체 진행률
          </span>
          <span className={`text-gray-600 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
            {totalProgress.percentage.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="h-3 rounded-full transition-all duration-1000 ease-out"
            style={{ 
              width: `${totalProgress.percentage}%`,
              background: `linear-gradient(90deg, ${stageInfo.color}80, ${stageInfo.color})`
            }}
          />
        </div>
      </div>

      {/* 현재 단계 진행률 */}
      {showDetails && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className={`text-gray-700 font-medium ${sizeClasses[size]}`}>
              현재 단계 진행률
            </span>
            <span className={`text-gray-600 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
              {stageProgress.current} / {stageProgress.total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div 
              className="h-2 rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: `${stageProgress.percentage}%`,
                background: `linear-gradient(90deg, ${stageInfo.color}60, ${stageInfo.color}80)`
              }}
            />
          </div>
        </div>
      )}

      {/* 다음 단계 정보 */}
      {stage < 6 && (
        <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: stageInfo.colorLight }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{nextStageInfo.emoji}</span>
              <div>
                <p className={`font-medium ${sizeClasses[size]}`} style={{ color: nextStageInfo.color }}>
                  다음 단계: {nextStageInfo.title}
                </p>
                <p className={`text-gray-600 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
                  {nextStageInfo.description}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`font-bold ${sizeClasses[size]}`} style={{ color: nextStageInfo.color }}>
                {pointsNeeded}점
              </p>
              <p className={`text-gray-500 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
                남음
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 모든 단계 표시 */}
      {showAllStages && (
        <div className="mb-4">
          <h4 className={`font-medium text-gray-700 mb-3 ${sizeClasses[size]}`}>
            관계 발전 단계
          </h4>
          <div className="space-y-2">
            {Object.entries(RELATIONSHIP_STAGES).map(([stageNum, stageData]) => {
              const stageNumber = parseInt(stageNum);
              const isCurrentStage = stageNumber === stage;
              const isCompleted = stageNumber < stage;
              const isNext = stageNumber === stage + 1;
              
              return (
                <div 
                  key={stageNumber}
                  className={`
                    flex items-center space-x-3 p-2 rounded-lg transition-all duration-300
                    ${isCurrentStage ? 'shadow-sm border-2' : 'border'}
                    ${isCompleted ? 'bg-green-50 border-green-200' : 
                      isCurrentStage ? 'border-2' : 
                      isNext ? 'bg-blue-50 border-blue-200' : 
                      'bg-gray-50 border-gray-200'}
                  `}
                  style={isCurrentStage ? { 
                    backgroundColor: stageData.colorLight,
                    borderColor: stageData.color 
                  } : {}}
                >
                  <div className="flex-shrink-0">
                    <div className={`
                      w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
                      ${isCompleted ? 'bg-green-500 text-white' : 
                        isCurrentStage ? 'text-white' : 
                        isNext ? 'bg-blue-500 text-white' : 
                        'bg-gray-300 text-gray-600'}
                    `}
                    style={isCurrentStage ? { backgroundColor: stageData.color } : {}}
                    >
                      {isCompleted ? '✓' : stageNumber}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{stageData.emoji}</span>
                      <span className={`font-medium ${
                        isCurrentStage ? 'text-gray-900' : 
                        isCompleted ? 'text-green-700' : 
                        isNext ? 'text-blue-700' : 
                        'text-gray-500'
                      }`}>
                        {stageData.title}
                      </span>
                    </div>
                    <p className={`text-xs ${
                      isCurrentStage ? 'text-gray-700' : 
                      isCompleted ? 'text-green-600' : 
                      isNext ? 'text-blue-600' : 
                      'text-gray-400'
                    }`}>
                      {stageData.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${
                      isCurrentStage ? 'text-gray-700' : 
                      isCompleted ? 'text-green-600' : 
                      'text-gray-500'
                    }`}>
                      {stageData.min} - {stageData.max}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 관계 조언 */}
      {showAdvice && (
        <div className="mb-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-pink-200">
          <h4 className={`font-medium text-pink-800 mb-2 ${sizeClasses[size]}`}>
            💡 {advice.title}
          </h4>
          <p className={`text-pink-700 mb-2 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
            {advice.message}
          </p>
          <p className={`text-pink-600 ${size === 'small' ? 'text-xs' : 'text-sm'}`}>
            {advice.action}
          </p>
        </div>
      )}

      {/* 추천 활동 */}
      {showAdvice && (
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <h4 className={`font-medium text-blue-800 mb-2 ${sizeClasses[size]}`}>
            🎯 추천 활동
          </h4>
          <div className="flex flex-wrap gap-2">
            {recommendedEvents.map((event, index) => (
              <span 
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium"
              >
                {event}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default RelationshipStageIndicator; 