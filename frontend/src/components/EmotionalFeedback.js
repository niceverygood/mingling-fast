import React, { useState, useEffect } from 'react';

// 감정 타입 정의
const EMOTIONS = {
  happy: { 
    emoji: '😊', 
    color: 'text-yellow-500', 
    bg: 'bg-yellow-100',
    name: '기쁨',
    description: '기분이 좋아 보여요!'
  },
  excited: { 
    emoji: '🤗', 
    color: 'text-pink-500', 
    bg: 'bg-pink-100',
    name: '설렘',
    description: '설레고 있는 것 같아요!'
  },
  neutral: { 
    emoji: '😐', 
    color: 'text-gray-500', 
    bg: 'bg-gray-100',
    name: '평온',
    description: '평온한 상태예요'
  },
  shy: { 
    emoji: '😳', 
    color: 'text-red-400', 
    bg: 'bg-red-100',
    name: '수줍음',
    description: '조금 부끄러워해요'
  },
  curious: { 
    emoji: '🤔', 
    color: 'text-purple-500', 
    bg: 'bg-purple-100',
    name: '호기심',
    description: '궁금해하는 것 같아요'
  },
  sad: { 
    emoji: '😢', 
    color: 'text-blue-500', 
    bg: 'bg-blue-100',
    name: '슬픔',
    description: '조금 슬퍼 보여요'
  }
};

// 효과음 시스템
const SoundEffects = {
  messageSent: '/sounds/message-sent.mp3',
  messageReceived: '/sounds/message-received.mp3',
  emotionChange: '/sounds/emotion-change.mp3',
  heartbeat: '/sounds/heartbeat.mp3'
};

const playSound = (soundType) => {
  try {
    const audio = new Audio(SoundEffects[soundType]);
    audio.volume = 0.3;
    audio.play().catch(e => console.log('Sound play failed:', e));
  } catch (error) {
    console.log('Audio not supported');
  }
};

// 타이핑 인디케이터 컴포넌트
export const TypingIndicator = ({ characterName, avatarUrl, isVisible }) => {
  if (!isVisible) return null;
  
  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-2xl mb-3 animate-fadeIn">
      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
        <span className="text-sm">👤</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
        <span className="text-sm text-gray-500">{characterName}이 입력 중...</span>
      </div>
    </div>
  );
};

// 감정 상태 표시 컴포넌트
export const EmotionStatus = ({ emotion, intensity = 50, characterName }) => {
  const [prevEmotion, setPrevEmotion] = useState(emotion);
  const [showChange, setShowChange] = useState(false);
  
  useEffect(() => {
    if (prevEmotion !== emotion) {
      setShowChange(true);
      playSound('emotionChange');
      setPrevEmotion(emotion);
      
      const timer = setTimeout(() => {
        setShowChange(false);
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [emotion, prevEmotion]);
  
  const currentEmotion = EMOTIONS[emotion] || EMOTIONS.neutral;
  
  return (
    <div className="relative">
      <div className={`flex items-center space-x-3 p-3 rounded-xl ${currentEmotion.bg} transition-all duration-300`}>
        <div className="relative">
          <span className="text-2xl">{currentEmotion.emoji}</span>
          {showChange && (
            <div className="absolute -top-2 -right-2 animate-ping">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
            </div>
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className={`text-sm font-medium ${currentEmotion.color}`}>
              {currentEmotion.name}
            </span>
            <span className="text-xs text-gray-500">{intensity}%</span>
          </div>
          <p className="text-xs text-gray-600 mb-2">{currentEmotion.description}</p>
          
          {/* 감정 강도 바 */}
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${currentEmotion.color.replace('text-', 'bg-')}`}
              style={{ width: `${intensity}%` }}
            />
          </div>
        </div>
      </div>
      
      {/* 감정 변화 알림 */}
      {showChange && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 animate-fadeIn">
          <div className="bg-white border border-gray-200 rounded-lg px-3 py-1 shadow-lg">
            <span className="text-xs text-gray-600">감정이 변화했어요!</span>
          </div>
        </div>
      )}
    </div>
  );
};

// 첫 만남 특별 효과
export const FirstMeetingEffect = ({ characterName, characterAvatar, onComplete }) => {
  const [stage, setStage] = useState(0);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      if (stage < 4) {
        setStage(stage + 1);
      } else {
        onComplete();
      }
    }, 1500);
    
    return () => clearTimeout(timer);
  }, [stage, onComplete]);
  
  const stages = [
    { emoji: '✨', text: '새로운 만남' },
    { emoji: '💫', text: `${characterName}과 처음 만나네요!` },
    { emoji: '💕', text: '특별한 인연이 될 것 같아요' },
    { emoji: '🎉', text: '대화를 시작해보세요!' }
  ];
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-3xl p-8 text-center max-w-sm mx-4 animate-scaleIn">
        {stage < 4 && (
          <div className="animate-fadeIn">
            <div className="text-6xl mb-4">{stages[stage].emoji}</div>
            <p className="text-lg font-medium text-gray-800 mb-4">{stages[stage].text}</p>
            {stage === 1 && characterAvatar && (
              <div className="w-20 h-20 mx-auto mb-4">
                <img 
                  src={characterAvatar} 
                  alt={characterName}
                  className="w-full h-full object-cover rounded-full border-4 border-pink-200"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// 메시지 전송 효과
export const MessageSentEffect = ({ show }) => {
  useEffect(() => {
    if (show) {
      playSound('messageSent');
    }
  }, [show]);
  
  if (!show) return null;
  
  return (
    <div className="fixed top-4 right-4 z-40 animate-fadeIn">
      <div className="bg-green-500 text-white p-2 rounded-lg flex items-center space-x-2">
        <span className="text-sm">💌</span>
        <span className="text-sm">메시지 전송!</span>
      </div>
    </div>
  );
};

// 메시지 수신 효과
export const MessageReceivedEffect = ({ show, characterName }) => {
  useEffect(() => {
    if (show) {
      playSound('messageReceived');
    }
  }, [show]);
  
  if (!show) return null;
  
  return (
    <div className="fixed top-4 left-4 z-40 animate-fadeIn">
      <div className="bg-blue-500 text-white p-2 rounded-lg flex items-center space-x-2">
        <span className="text-sm">💬</span>
        <span className="text-sm">{characterName}의 답장!</span>
      </div>
    </div>
  );
};

// 통합 감정 피드백 시스템
export const EmotionalFeedbackSystem = ({ 
  isTyping, 
  emotion, 
  emotionIntensity, 
  characterName, 
  characterAvatar,
  isFirstMeeting,
  onFirstMeetingComplete,
  showMessageSent,
  showMessageReceived 
}) => {
  return (
    <>
      {isFirstMeeting && (
        <FirstMeetingEffect 
          characterName={characterName}
          characterAvatar={characterAvatar}
          onComplete={onFirstMeetingComplete}
        />
      )}
      
      <TypingIndicator 
        characterName={characterName}
        avatarUrl={characterAvatar}
        isVisible={isTyping}
      />
      
      <EmotionStatus 
        emotion={emotion}
        intensity={emotionIntensity}
        characterName={characterName}
      />
      
      <MessageSentEffect show={showMessageSent} />
      <MessageReceivedEffect show={showMessageReceived} characterName={characterName} />
    </>
  );
};

export default EmotionalFeedbackSystem; 