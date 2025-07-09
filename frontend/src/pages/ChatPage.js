import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, HeartIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { heartsAPI, chatsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import FavorabilityGauge, { FavorabilityChangeNotification } from '../components/FavorabilityGauge';
import TypingAnimation from '../components/TypingAnimation';
import { getRelationInfo } from '../services/relationshipAPI';
import { goToHeartShopWithAlert, openHeartShop, isInApp, listenForHeartUpdates } from '../utils/webview';
import { usePopup } from '../context/PopupContext';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const { isLoggedIn, user: authUser } = useAuth();
  
  // 커스텀 팝업 훅
  const { showInsufficientHearts, showError } = usePopup();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hearts, setHearts] = useState(150);
  const [heartLoading, setHeartLoading] = useState(false);
  const [isGeneratingResponse, setIsGeneratingResponse] = useState(false);
  const [hasInitiallyScrolled, setHasInitiallyScrolled] = useState(false);
  
  // 타이핑 애니메이션 관련 상태
  const [typingMessage, setTypingMessage] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  
  // 호감도 관련 상태
  const [relationInfo, setRelationInfo] = useState(null);
  const [favorabilityNotification, setFavorabilityNotification] = useState(null);
  
  // 다음 단계까지 남은 점수 계산 (실시간 업데이트)
  const nextStageInfo = useMemo(() => {
    if (!relationInfo) return null;
    
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
  }, [relationInfo]);
  
  // 스크롤 자동 이동을 위한 ref
  const messagesEndRef = useRef(null);
  // 텍스트 입력 필드 커서 유지를 위한 ref
  const inputRef = useRef(null);

  // 최초 메시지 로딩 완료 시에만 스크롤 실행 (메시지 변경에 반응하지 않음)
  useEffect(() => {
    if (!loading && !hasInitiallyScrolled) {
      // 메시지가 있든 없든 스크롤 위치를 최하단으로 설정 (애니메이션 없이 즉시)
      setTimeout(() => {
        scrollToBottomInstant();
        setHasInitiallyScrolled(true);
      }, 50); // 더 짧은 딜레이로 빠르게 스크롤
    }
  }, [loading, hasInitiallyScrolled]); // messages 의존성 제거

  // 새 메시지 전송 시에만 스크롤 (AI 응답 생성 중일 때)
  useEffect(() => {
    if (isGeneratingResponse) {
      scrollToBottom();
    }
  }, [isGeneratingResponse]);

  // 타이핑 애니메이션 시작 시 스크롤
  useEffect(() => {
    if (isTyping) {
      scrollToBottom();
    }
  }, [isTyping]);

  // 즉시 스크롤 (애니메이션 없음) - 초기 로딩 시 사용
  const scrollToBottomInstant = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
  };

  // 부드러운 스크롤 - 새 메시지 전송 시 사용
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (chatId) {
      // 새로운 채팅방으로 이동할 때 초기화
      setHasInitiallyScrolled(false);
      fetchChatInfo();
      fetchMessages();
      fetchHeartBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  // 네이티브 앱에서 하트 업데이트 리스너
  useEffect(() => {
    if (isInApp()) {
      const removeListener = listenForHeartUpdates((newHearts) => {
        console.log('📱 네이티브에서 하트 업데이트 수신:', newHearts);
        setHearts(newHearts);
      });
      
      return removeListener;
    }
  }, []);

  // 감정 관련 함수 제거됨

  // 호감도 정보 불러오기 (개선된 버전)
  const fetchRelationInfo = async (characterId) => {
    try {
      console.log('🔄 관계 정보 불러오기 시도:', characterId);
      const relationData = await getRelationInfo(characterId);
      console.log('✅ 관계 정보 불러오기 성공:', relationData);
      
      if (relationData && relationData.data) {
        setRelationInfo(relationData.data);
      } else {
        // 기본값 설정
        setRelationInfo({
          score: 0,
          stage: 0,
          stageChanged: false
        });
      }
    } catch (error) {
      console.error('❌ 관계 정보 불러오기 실패:', error);
      // 기본값 설정
      setRelationInfo({
        score: 0,
        stage: 0,
        stageChanged: false
      });
    }
  };

  // 채팅 정보가 로드되면 호감도 정보도 불러오기
  useEffect(() => {
    if (chatInfo?.character?.id) {
      fetchRelationInfo(chatInfo.character.id);
      
      // 첫 만남 감지 (메시지가 없거나 1개 이하인 경우)
      // if (messages.length <= 1) { // 첫 만남 애니메이션 제거
      //   setIsFirstMeeting(true);
      // }
    }
  }, [chatInfo, messages.length]);

  const fetchHeartBalance = async () => {
    try {
      const response = await heartsAPI.getBalance();
      setHearts(response.data.hearts);
    } catch (error) {
      console.error('Error fetching heart balance:', error);
      // 실패 시 기본값 유지
    }
  };

  const fetchChatInfo = async () => {
    try {
      // 채팅 목록에서 해당 채팅 정보 찾기
      const response = await chatsAPI.getAll();
      if (Array.isArray(response.data)) {
        const chat = response.data.find(c => c.id === chatId);
        setChatInfo(chat);
      } else {
        console.error('Received non-array response for chats:', response.data);
      }
    } catch (error) {
      console.error('Error fetching chat info:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await chatsAPI.getMessages(chatId);
      // 응답이 배열인지 확인
      if (Array.isArray(response.data)) {
        setMessages(response.data);
      } else {
        console.error('Received non-array response for messages:', response.data);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    // 하트가 부족한 경우
    if (hearts < 1) {
      if (isInApp()) {
        // 네이티브 앱에서는 네이티브 하트샵 열기
        openHeartShop(hearts);
      } else {
        // 웹에서는 기존 팝업 방식 유지
        showInsufficientHearts(hearts, {
          onConfirm: () => navigate('/heart-shop'),
          onCancel: () => {}
        });
      }
      return;
    }

    // 전송할 메시지 내용을 미리 저장 (언어 변환 방지)
    const userMessageContent = newMessage.trim();
    
    // 입력창 즉시 비우기 (전송 후 언어 변환 방지)
    setNewMessage('');
    
    // 메시지 전송 효과 표시
    // setShowMessageSent(true); // 메시지 전송 효과 제거
    // setTimeout(() => setShowMessageSent(false), 2000); // 메시지 전송 효과 제거
    
    // 입력 필드에 포커스 유지 (약간의 딜레이 후 실행)
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 100);

    // 사용자 메시지를 즉시 화면에 추가
    const tempUserMessage = {
      id: `temp-user-${Date.now()}`,
      content: userMessageContent,
      isFromUser: true,
      createdAt: new Date().toISOString()
    };

    setMessages(prevMessages => [...prevMessages, tempUserMessage]);
    setHeartLoading(true);
    setIsGeneratingResponse(true);
    
    // AI 타이핑 애니메이션 시작 (감정 관련 제거)
    // setTimeout(() => {
    //   setIsTyping(true); 
    //   updateEmotionBasedOnMessage(userMessageContent);
    // }, 500);

    try {
      // 하트 차감
      const heartResponse = await heartsAPI.spend(1, '채팅 메시지 전송');
      setHearts(heartResponse.data.hearts); // 업데이트된 하트 수 반영

      // 메시지 전송 (백엔드에서 사용자 메시지 + AI 응답 모두 받아옴)
      const messageResponse = await chatsAPI.sendMessage(chatId, {
        content: userMessageContent
      });
      
      // 호감도 변화 처리
      if (messageResponse.data.favorability) {
        const favorabilityData = messageResponse.data.favorability;
        
        console.log('🔄 호감도 변화 데이터:', favorabilityData);
        
        // 호감도 정보 즉시 업데이트 (강제 리렌더링)
        if (favorabilityData.relation) {
          console.log('🔄 이전 관계 정보:', relationInfo);
          console.log('🔄 새로운 관계 정보:', favorabilityData.relation);
          
          // 새로운 객체로 상태 업데이트 (React 리렌더링 보장)
          setRelationInfo(prevInfo => ({
            ...favorabilityData.relation,
            // 타임스탬프 추가로 강제 업데이트
            _lastUpdated: Date.now()
          }));
          
          console.log('✅ 관계 정보 즉시 업데이트 완료');
        }
        
        // 변화 알림 표시
        if (favorabilityData.deltaScore !== 0) {
          setFavorabilityNotification({
            deltaScore: favorabilityData.deltaScore,
            oldStage: favorabilityData.oldStage,
            newStage: favorabilityData.newStage || favorabilityData.relation?.stage,
            stageChanged: favorabilityData.stageChanged
          });
          
          // 3초 후 알림 자동 제거
          setTimeout(() => {
            setFavorabilityNotification(null);
          }, 3000);
        }
        
        // 메시지 전송 후 관계 정보 다시 불러오기 (최종 동기화 보장)
        setTimeout(() => {
          if (chatInfo?.character?.id) {
            fetchRelationInfo(chatInfo.character.id);
          }
        }, 500);
      } else {
        // 호감도 데이터가 없는 경우에도 관계 정보 새로고침
        console.log('⚠️ 호감도 데이터 없음, 관계 정보 새로고침');
        setTimeout(() => {
          if (chatInfo?.character?.id) {
            fetchRelationInfo(chatInfo.character.id);
          }
        }, 500);
      }
      
      // 임시 사용자 메시지 제거하고 실제 메시지들로 교체
      setMessages(prevMessages => {
        // 임시 메시지 제거
        const filteredMessages = prevMessages.filter(msg => msg.id !== tempUserMessage.id);
        
        // 응답이 배열인지 확인하고 새 메시지들 추가
        const messagesData = messageResponse.data.messages || messageResponse.data;
        if (Array.isArray(messagesData)) {
          // 사용자 메시지는 즉시 표시하고, AI 응답은 타이핑 애니메이션 적용
          const userMessage = messagesData.find(msg => msg.isFromUser);
          const aiMessage = messagesData.find(msg => !msg.isFromUser);
          
          if (userMessage) {
            // 사용자 메시지 즉시 추가
            const newMessages = [...filteredMessages, userMessage];
            
            // AI 응답이 있으면 타이핑 애니메이션 시작
            if (aiMessage) {
              setTypingMessage(aiMessage);
              setIsTyping(true);
            }
            
            return newMessages;
          } else {
            return [...filteredMessages, ...messagesData];
          }
        } else {
          console.error('Received non-array response for new messages:', messagesData);
          // 단일 메시지인 경우를 대비하여 배열로 감싸서 추가
          if (messagesData && typeof messagesData === 'object') {
            return [...filteredMessages, messagesData];
          }
          return filteredMessages;
        }
      });

    } catch (error) {
      console.error('Error sending message:', error);
      
      // 타이핑 애니메이션 종료
      setIsTyping(false);
      setTypingMessage(null);
      
      // 에러 발생 시 임시 사용자 메시지 제거
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempUserMessage.id));
      
      if (error.response?.data?.error === 'Insufficient hearts') {
        if (isInApp()) {
          // 네이티브 앱에서는 네이티브 하트샵 열기
          openHeartShop(hearts);
        } else {
          // 웹에서는 기존 팝업 방식 유지
          showInsufficientHearts(hearts, {
            onConfirm: () => navigate('/heart-shop'),
            onCancel: () => {}
          });
        }
      } else {
        showError('메시지 전송에 실패했습니다.');
      }
    } finally {
      setHeartLoading(false);
      setIsGeneratingResponse(false);
      
      // 모든 작업 완료 후 다시 한 번 포커스 설정
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 200);
    }
  };

  const handleBack = () => {
    navigate('/chats');
  };

  // 타이핑 애니메이션 완료 처리
  const handleTypingComplete = () => {
    if (typingMessage) {
      setMessages(prevMessages => [...prevMessages, typingMessage]);
      setTypingMessage(null);
      setIsTyping(false);
    }
  };

  // 로딩 인디케이터 컴포넌트
  const LoadingIndicator = () => (
    <div className="flex justify-start mb-1">
      <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-gray-100 text-gray-900">
        <div className="flex items-center space-x-1">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
        </div>
      </div>
    </div>
  );

  // 실제 데이터만 사용 - 더미 하트 수 제거됨

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">채팅을 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div className="flex items-center space-x-3">
          <button 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeftIcon className="w-6 h-6 text-gray-600" />
          </button>
          <div className="flex items-center space-x-3">
            <Avatar 
              src={chatInfo?.character?.avatarUrl}
              alt={chatInfo?.character?.name}
              name={chatInfo?.character?.name}
              size="lg"
              fallbackType="emoji"
              className="w-10 h-10"
            />
            <h1 className="text-lg font-semibold">{chatInfo?.character?.name || '채팅'}</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <HeartIcon className={`w-6 h-6 ${hearts < 1 ? 'text-gray-400' : 'text-red-500'}`} />
          <span className={`text-sm font-medium ${hearts < 1 ? 'text-gray-400' : 'text-black'}`}>
            {hearts}
          </span>
          {heartLoading && (
            <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          )}
        </div>
      </div>

      {/* Favorability Section */}
      {relationInfo && (
        <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="text-2xl">
                {relationInfo.stage === 0 && '👋'}
                {relationInfo.stage === 1 && '😊'}
                {relationInfo.stage === 2 && '😄'}
                {relationInfo.stage === 3 && '💕'}
                {relationInfo.stage === 4 && '💖'}
                {relationInfo.stage === 5 && '💍'}
                {relationInfo.stage === 6 && '👑'}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-800">
                  {relationInfo.stage === 0 && '아는 사람'}
                  {relationInfo.stage === 1 && '친구'}
                  {relationInfo.stage === 2 && '썸 전야'}
                  {relationInfo.stage === 3 && '연인'}
                  {relationInfo.stage === 4 && '진지한 관계'}
                  {relationInfo.stage === 5 && '약혼'}
                  {relationInfo.stage === 6 && '결혼'}
                </div>
                <div className="text-xs text-gray-500">
                  {relationInfo.stage === 0 && '서로를 알아가는 중'}
                  {relationInfo.stage === 1 && '편안한 친구 사이'}
                  {relationInfo.stage === 2 && '특별한 감정이 싹트는 중'}
                  {relationInfo.stage === 3 && '서로 사랑하는 연인'}
                  {relationInfo.stage === 4 && '깊은 사랑으로 이어진'}
                  {relationInfo.stage === 5 && '결혼을 약속한 사이'}
                  {relationInfo.stage === 6 && '영원한 사랑을 맹세한'}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate(`/relationship/${chatInfo?.character?.id}`)}
              className="px-3 py-1.5 text-xs text-pink-600 hover:text-pink-800 border border-pink-300 hover:border-pink-400 bg-pink-50 hover:bg-pink-100 rounded-md transition-all duration-200"
            >
              관계 관리
            </button>
          </div>
          
          {/* 진행률 바 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-600">전체 진행률</span>
              <span className="text-xs font-medium text-gray-700">
                {nextStageInfo?.progressPercentage || '0.0'}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="h-2 rounded-full transition-all duration-1000 ease-out"
                style={{ 
                  width: `${(relationInfo.score / 1000) * 100}%`,
                  background: `linear-gradient(to right, 
                    ${relationInfo.stage === 0 ? '#9CA3AF' : 
                      relationInfo.stage === 1 ? '#60A5FA' : 
                      relationInfo.stage === 2 ? '#34D399' : 
                      relationInfo.stage === 3 ? '#F472B6' : 
                      relationInfo.stage === 4 ? '#A78BFA' : 
                      relationInfo.stage === 5 ? '#FB7185' : '#FBBF24'}, 
                    ${relationInfo.stage === 0 ? '#6B7280' : 
                      relationInfo.stage === 1 ? '#3B82F6' : 
                      relationInfo.stage === 2 ? '#10B981' : 
                      relationInfo.stage === 3 ? '#EC4899' : 
                      relationInfo.stage === 4 ? '#8B5CF6' : 
                      relationInfo.stage === 5 ? '#F43F5E' : '#F59E0B'})`
                }}
              />
            </div>
            
            {/* 다음 단계 정보 (실시간 업데이트) */}
            {nextStageInfo && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">
                  다음 단계: {nextStageInfo.nextStageLabel}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {nextStageInfo.pointsNeeded}점 남음
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Emotion Status Section */}
      {/* 감정 관련 UI 제거 */}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 pb-8 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'} mb-1`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.isFromUser
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm leading-relaxed text-left">{message.content}</p>
              </div>
            </div>
            <div className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}>
              <p className="text-xs text-gray-400 px-2">
                오전 {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          </div>
        ))}
        
        {/* 타이핑 애니메이션 표시 */}
        {isTyping && typingMessage && (
          <div key={`typing-${typingMessage.id}`}>
            <div className="flex justify-start mb-1">
              <div className="max-w-xs lg:max-w-md px-4 py-3 rounded-2xl bg-gray-100 text-gray-900">
                <p className="text-sm leading-relaxed text-left">
                  <TypingAnimation
                    text={typingMessage.content}
                    speed={30}
                    onComplete={handleTypingComplete}
                  />
                </p>
              </div>
            </div>
            <div className="flex justify-start">
              <p className="text-xs text-gray-400 px-2">
                오전 {new Date(typingMessage.createdAt).toLocaleTimeString('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true
                })}
              </p>
            </div>
          </div>
        )}
        
        {/* 응답 생성 중일 때 로딩 인디케이터 표시 */}
        {isGeneratingResponse && !isTyping && <LoadingIndicator />}
        
        {/* 스크롤 자동 이동을 위한 빈 div */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-3">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !heartLoading && hearts >= 1 && !isGeneratingResponse && handleSendMessage()}
            onClick={() => hearts < 1 && (isInApp() ? openHeartShop(hearts) : showInsufficientHearts(hearts, {
              onConfirm: () => navigate('/heart-shop'),
              onCancel: () => {}
            }))}
            placeholder={hearts < 1 ? "하트가 부족합니다. 하트를 충전해주세요!" : "메시지를 입력하세요... (1 하트 소모)"}
            disabled={hearts < 1 || heartLoading || isGeneratingResponse}
            className={`flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 text-sm ${
              hearts < 1 || heartLoading || isGeneratingResponse
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-pointer' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || hearts < 1 || heartLoading || isGeneratingResponse}
            className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            title={hearts < 1 ? '하트가 부족합니다' : '메시지 전송 (1 하트 소모)'}
          >
            {heartLoading || isGeneratingResponse ? (
              <div className="w-5 h-5 border border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Emotional Feedback System */}
      {/* 감정 관련 UI 제거 */}
      
      {/* Favorability Change Notification */}
      {favorabilityNotification && (
        <FavorabilityChangeNotification
          deltaScore={favorabilityNotification.deltaScore}
          oldStage={favorabilityNotification.oldStage}
          newStage={favorabilityNotification.newStage}
          stageChanged={favorabilityNotification.stageChanged}
          onClose={() => setFavorabilityNotification(null)}
        />
      )}
    </div>
  );
};

export default ChatPage; 