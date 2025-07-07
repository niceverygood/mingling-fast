import React from 'react';

// 호감도 단계 정의 (백엔드와 동일)
const STAGES = {
  0: { label: 'Acquaintance', min: 0, max: 149, description: '아는 사람', color: '#9CA3AF', emoji: '👋' },
  1: { label: 'Casual Friend', min: 150, max: 299, description: '친구', color: '#60A5FA', emoji: '😊' },
  2: { label: 'Close Friend', min: 300, max: 499, description: '썸 전야', color: '#34D399', emoji: '😄' },
  3: { label: 'Dating', min: 500, max: 699, description: '연인', color: '#F472B6', emoji: '💕' },
  4: { label: 'Serious', min: 700, max: 849, description: '진지한 관계', color: '#A78BFA', emoji: '💖' },
  5: { label: 'Engaged', min: 850, max: 929, description: '약혼', color: '#FB7185', emoji: '💍' },
  6: { label: 'Married', min: 930, max: 1000, description: '결혼', color: '#FBBF24', emoji: '👑' }
};

const FavorabilityGauge = ({ 
  score = 0, 
  stage = 0, 
  showDetails = true, 
  size = 'normal',
  animated = true 
}) => {
  const stageInfo = STAGES[stage];
  const progressInStage = score - stageInfo.min;
  const maxProgressInStage = stageInfo.max - stageInfo.min + 1;
  const progressPercentage = Math.max(0, Math.min(100, (progressInStage / maxProgressInStage) * 100));
  
  // 크기별 스타일
  const sizeClasses = {
    small: 'h-2',
    normal: 'h-3',
    large: 'h-4'
  };
  
  const textSizeClasses = {
    small: 'text-xs',
    normal: 'text-sm',
    large: 'text-base'
  };

  return (
    <div className={`favorability-gauge ${animated ? 'transition-all duration-500' : ''}`}>
      {showDetails && (
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-lg">{stageInfo.emoji}</span>
            <div>
              <div className={`font-semibold ${textSizeClasses[size]}`} style={{ color: stageInfo.color }}>
                {stageInfo.description}
              </div>
              <div className={`text-gray-500 ${size === 'small' ? 'text-xs' : 'text-xs'}`}>
                {stageInfo.label}
              </div>
            </div>
          </div>
          <div className={`text-right ${textSizeClasses[size]}`}>
            <div className="font-bold" style={{ color: stageInfo.color }}>
              {score}
            </div>
            <div className="text-gray-400 text-xs">
              / 1000
            </div>
          </div>
        </div>
      )}
      
      {/* 전체 진행률 바 */}
      <div className="mb-2">
        <div className="flex justify-between items-center mb-1">
          <span className={`text-gray-600 ${textSizeClasses[size]}`}>
            전체 진행률
          </span>
          <span className={`text-gray-500 ${size === 'small' ? 'text-xs' : 'text-xs'}`}>
            {((score / 1000) * 100).toFixed(1)}%
          </span>
        </div>
        <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]} overflow-hidden`}>
          <div 
            className={`${sizeClasses[size]} rounded-full transition-all duration-1000 ease-out`}
            style={{ 
              width: `${(score / 1000) * 100}%`,
              backgroundColor: stageInfo.color,
              boxShadow: animated ? `0 0 10px ${stageInfo.color}40` : 'none'
            }}
          />
        </div>
      </div>

      {/* 현재 단계 진행률 바 */}
      {showDetails && (
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className={`text-gray-600 ${textSizeClasses[size]}`}>
              현재 단계 진행률
            </span>
            <span className={`text-gray-500 ${size === 'small' ? 'text-xs' : 'text-xs'}`}>
              {progressInStage} / {maxProgressInStage}
            </span>
          </div>
          <div className={`w-full bg-gray-200 rounded-full ${sizeClasses[size]} overflow-hidden`}>
            <div 
              className={`${sizeClasses[size]} rounded-full transition-all duration-1000 ease-out`}
              style={{ 
                width: `${progressPercentage}%`,
                backgroundColor: stageInfo.color,
                opacity: 0.8
              }}
            />
          </div>
          
          {/* 다음 단계 정보 */}
          {stage < 6 && (
            <div className="mt-2 text-center">
              <span className={`text-gray-500 ${size === 'small' ? 'text-xs' : 'text-xs'}`}>
                다음 단계: {STAGES[stage + 1].description} 
                <span className="ml-1" style={{ color: STAGES[stage + 1].color }}>
                  {STAGES[stage + 1].emoji}
                </span>
                <span className="ml-1">
                  ({STAGES[stage + 1].min - score}점 남음)
                </span>
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// 호감도 변화 알림 컴포넌트
export const FavorabilityChangeNotification = ({ 
  deltaScore, 
  oldStage, 
  newStage, 
  stageChanged,
  onClose 
}) => {
  const isPositive = deltaScore > 0;
  const stageInfo = STAGES[newStage];
  
  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in">
      <div className={`
        bg-white rounded-lg shadow-lg border-l-4 p-4 max-w-sm
        ${stageChanged 
          ? 'border-yellow-400 bg-gradient-to-r from-yellow-50 to-orange-50' 
          : isPositive 
            ? 'border-green-400 bg-green-50' 
            : 'border-red-400 bg-red-50'
        }
      `}>
        <div className="flex items-start">
          <div className="flex-shrink-0">
            {stageChanged ? (
              <span className="text-2xl">🎉</span>
            ) : isPositive ? (
              <span className="text-xl">💕</span>
            ) : (
              <span className="text-xl">💔</span>
            )}
          </div>
          <div className="ml-3 flex-1">
            {stageChanged ? (
              <div>
                <p className="text-sm font-semibold text-yellow-800">
                  관계 단계 변화!
                </p>
                <p className="text-sm text-yellow-700">
                  {STAGES[oldStage].description} → {stageInfo.description}
                </p>
                <div className="mt-1 flex items-center">
                  <span className="text-lg mr-2">{stageInfo.emoji}</span>
                  <span className="text-sm font-medium" style={{ color: stageInfo.color }}>
                    {stageInfo.description}
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p className={`text-sm font-semibold ${
                  isPositive ? 'text-green-800' : 'text-red-800'
                }`}>
                  호감도 {isPositive ? '상승' : '하락'}
                </p>
                <p className={`text-sm ${
                  isPositive ? 'text-green-700' : 'text-red-700'
                }`}>
                  {isPositive ? '+' : ''}{deltaScore}점
                </p>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-2 text-gray-400 hover:text-gray-600"
          >
            <span className="sr-only">닫기</span>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// 호감도 히스토리 컴포넌트
export const FavorabilityHistory = ({ events = [], currentRelation }) => {
  const formatEventType = (eventType) => {
    const typeMap = {
      'chat_positive': '긍정적 대화',
      'chat_negative': '부정적 대화',
      'gift': '선물',
      'date': '데이트',
      'conflict': '갈등',
      'decay': '시간 경과',
      'manual_adjustment': '조정'
    };
    return typeMap[eventType] || eventType;
  };

  const getEventIcon = (eventType, deltaScore) => {
    if (deltaScore > 0) {
      return eventType === 'gift' ? '🎁' : 
             eventType === 'date' ? '💖' : 
             eventType.includes('chat') ? '💕' : '⬆️';
    } else {
      return eventType === 'conflict' ? '💥' : 
             eventType === 'decay' ? '⏰' : '⬇️';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  return (
    <div className="favorability-history bg-white rounded-lg shadow-sm border">
      <div className="p-4 border-b">
        <h3 className="text-lg font-semibold text-gray-900">호감도 히스토리</h3>
        {currentRelation && (
          <div className="mt-2">
            <FavorabilityGauge 
              score={currentRelation.score}
              stage={currentRelation.stage}
              size="small"
              showDetails={false}
            />
          </div>
        )}
      </div>
      
      <div className="max-h-96 overflow-y-auto">
        {events.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            아직 기록된 이벤트가 없습니다.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event) => (
              <div key={event.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <span className="text-xl">
                      {getEventIcon(event.eventType, event.deltaScore)}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatEventType(event.eventType)}
                        </span>
                        <span className={`text-sm font-semibold ${
                          event.deltaScore > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {event.deltaScore > 0 ? '+' : ''}{event.deltaScore}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap ml-2">
                    {formatDate(event.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavorabilityGauge; 