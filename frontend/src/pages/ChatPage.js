import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, HeartIcon, PaperAirplaneIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
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
  
  // 모바일 터치 최적화 상태
  const [touchStartY, setTouchStartY] = useState(0);
  const [touchEndY, setTouchEndY] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const [buttonPressed, setButtonPressed] = useState(null);
  const [sendingMessage, setSendingMessage] = useState(false);
  
  // 모바일 최적화를 위한 ref
  const containerRef = useRef(null);
  const messagesContainerRef = useRef(null);
  
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

  // 아코디언 상태 추가
  const [isRelationshipExpanded, setIsRelationshipExpanded] = useState(true);

  // 모바일 터치 이벤트 핸들러
  const handleTouchStart = (e) => {
    setTouchStartY(e.touches[0].clientY);
    setIsScrolling(true);
  };

  const handleTouchEnd = (e) => {
    setTouchEndY(e.changedTouches[0].clientY);
    setIsScrolling(false);
  };

  // 터치 피드백 핸들러
  const handleButtonPress = (buttonId) => {
    setButtonPressed(buttonId);
    setTimeout(() => setButtonPressed(null), 150);
  };

  // 중복 터치 방지 핸들러
  const handleSendWithPreventDuplication = async () => {
    if (sendingMessage) return;
    setSendingMessage(true);
    
    try {
      await handleSendMessage();
    } finally {
      setTimeout(() => setSendingMessage(false), 500);
    }
  };

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
      handleButtonPress('heart-insufficient');
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

    try {
      console.log('💎 하트 차감 시작... 현재 하트:', hearts);
      
      // 하트 차감 (재시도 로직 포함)
      let heartResponse;
      let heartError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 하트 차감 시도 ${attempt}/3`);
          heartResponse = await heartsAPI.spend(1, '채팅 메시지 전송');
          console.log('✅ 하트 차감 성공:', heartResponse.data);
          break;
        } catch (error) {
          console.error(`❌ 하트 차감 시도 ${attempt} 실패:`, error);
          heartError = error;
          
          if (attempt < 3) {
            console.log('⏳ 0.5초 후 재시도...');
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      if (!heartResponse) {
        throw new Error(`하트 차감 실패: ${heartError?.message || '알 수 없는 오류'}`);
      }
      
      // 하트 잔액 업데이트
      setHearts(heartResponse.data.hearts);
      console.log('💎 하트 차감 완료. 새 잔액:', heartResponse.data.hearts);

      console.log('📨 메시지 전송 시작...');
      
      // 메시지 전송 (재시도 로직 포함)
      let messageResponse;
      let messageError = null;
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          console.log(`🔄 메시지 전송 시도 ${attempt}/3`);
          messageResponse = await chatsAPI.sendMessage(chatId, {
            content: userMessageContent
          });
          console.log('✅ 메시지 전송 성공:', messageResponse.data);
          break;
        } catch (error) {
          console.error(`❌ 메시지 전송 시도 ${attempt} 실패:`, error);
          messageError = error;
          
          if (attempt < 3) {
            console.log('⏳ 1초 후 재시도...');
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
      
      if (!messageResponse) {
        // 메시지 전송 실패 시 하트 복구 시도
        console.log('🔄 메시지 전송 실패로 인한 하트 복구 시도...');
        try {
          await heartsAPI.refund(1, '메시지 전송 실패로 인한 복구');
          setHearts(prev => prev + 1);
          console.log('✅ 하트 복구 완료');
        } catch (refundError) {
          console.error('❌ 하트 복구 실패:', refundError);
        }
        
        throw new Error(`메시지 전송 실패: ${messageError?.message || '서버 연결 오류'}`);
      }
      
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
      console.error('❌ 메시지 전송 전체 실패:', error);
      
      // 타이핑 애니메이션 종료
      setIsTyping(false);
      setTypingMessage(null);
      
      // 에러 발생 시 임시 사용자 메시지 제거
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempUserMessage.id));
      
      // 구체적인 에러 메시지 표시
      let errorMessage = '메시지 전송에 실패했습니다.';
      
      if (error.message.includes('하트 차감')) {
        errorMessage = '하트 차감 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.message.includes('서버 연결')) {
        errorMessage = '서버 연결에 문제가 있습니다. 네트워크 상태를 확인해주세요.';
      } else if (error.message.includes('Insufficient hearts')) {
        errorMessage = '하트가 부족합니다.';
        if (isInApp()) {
          openHeartShop(hearts);
        } else {
          showInsufficientHearts(hearts, {
            onConfirm: () => navigate('/heart-shop'),
            onCancel: () => {}
          });
        }
        return; // 하트 부족의 경우 에러 팝업 표시하지 않음
      } else if (error.response?.status >= 500) {
        errorMessage = '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else if (error.response?.status === 401) {
        errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.';
      }
      
      showError(errorMessage);
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
    handleButtonPress('back');
    setTimeout(() => navigate('/chats'), 150);
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
    <div className="flex justify-start mb-4">
      <div className="max-w-xs px-4 py-3 rounded-3xl bg-gray-100 text-gray-900 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <span className="text-xs text-gray-500">입력 중...</span>
        </div>
      </div>
    </div>
  );

  // 실제 데이터만 사용 - 더미 하트 수 제거됨

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen">
        <div className="flex justify-center items-center h-screen bg-white">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500 text-lg">채팅을 불러오는 중...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white h-screen flex flex-col">
      <div 
        ref={containerRef}
        className="flex flex-col h-screen bg-white overflow-hidden touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
      {/* Header - 모바일 최적화 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100 shadow-sm safe-area-top">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center space-x-3">
            <button 
              onClick={handleBack}
              className={`p-3 rounded-full transition-all duration-150 active:scale-95 ${
                buttonPressed === 'back' ? 'bg-gray-200 scale-95' : 'hover:bg-gray-100'
              }`}
              style={{ minWidth: '44px', minHeight: '44px' }}
            >
              <ArrowLeftIcon className="w-6 h-6 text-gray-700" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Avatar 
                  src={chatInfo?.character?.avatarUrl}
                  alt={chatInfo?.character?.name}
                  name={chatInfo?.character?.name}
                  size="lg"
                  fallbackType="emoji"
                  className="w-12 h-12 border-2 border-gray-200"
                />
                {/* 온라인 상태 표시 */}
                <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {chatInfo?.character?.name || '채팅'}
                </h1>
                <p className="text-sm text-gray-500">온라인</p>
              </div>
            </div>
          </div>
          
          {/* 하트 표시 - 모바일 최적화 */}
          <div 
            className={`flex items-center space-x-2 px-3 py-2 rounded-full transition-all duration-150 ${
              hearts < 1 ? 'bg-gray-100' : 'bg-red-50'
            }`}
            onClick={() => hearts < 1 && handleButtonPress('heart-insufficient')}
          >
            <HeartIcon className={`w-5 h-5 ${hearts < 1 ? 'text-gray-400' : 'text-red-500'}`} />
            <span className={`text-sm font-bold ${hearts < 1 ? 'text-gray-400' : 'text-red-600'}`}>
              {hearts}
            </span>
            {heartLoading && (
              <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            )}
          </div>
        </div>
      </div>

      {/* Relationship Info - Accordion Style */}
      {relationInfo && (
        <div className="flex-shrink-0 bg-gradient-to-r from-pink-50 to-purple-50 border-b border-gray-100">
          {/* Accordion Header - Always Visible */}
          <button
            onClick={() => setIsRelationshipExpanded(!isRelationshipExpanded)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/30 transition-colors duration-200"
          >
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
              <div className="text-left">
                <div className="text-base font-bold text-gray-900">
                  {relationInfo.stage === 0 && '아는 사람'}
                  {relationInfo.stage === 1 && '친구'}
                  {relationInfo.stage === 2 && '썸 전야'}
                  {relationInfo.stage === 3 && '연인'}
                  {relationInfo.stage === 4 && '진지한 관계'}
                  {relationInfo.stage === 5 && '약혼'}
                  {relationInfo.stage === 6 && '결혼'}
                </div>
                <div className="text-sm text-gray-600">
                  {relationInfo.score}/1000
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="text-right">
                <div className="text-sm font-bold text-pink-600">
                  {((relationInfo.score / 1000) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">
                  전체 진행률
                </div>
              </div>
              <div className="transition-transform duration-200">
                {isRelationshipExpanded ? (
                  <ChevronUpIcon className="w-5 h-5 text-gray-600" />
                ) : (
                  <ChevronDownIcon className="w-5 h-5 text-gray-600" />
                )}
              </div>
            </div>
          </button>

          {/* Accordion Content - Expandable */}
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${
            isRelationshipExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}>
            <div className="px-4 pb-4">
              {/* 관계 설명 */}
              <div className="mb-3 p-3 bg-white/50 rounded-lg">
                <p className="text-sm text-gray-700">
                  {relationInfo.stage === 0 && '서로를 알아가는 중이에요'}
                  {relationInfo.stage === 1 && '편안한 친구 사이예요'}
                  {relationInfo.stage === 2 && '특별한 감정이 싹트고 있어요'}
                  {relationInfo.stage === 3 && '서로 사랑하는 사이예요'}
                  {relationInfo.stage === 4 && '깊고 진지한 사랑이에요'}
                  {relationInfo.stage === 5 && '평생을 함께할 약속을 했어요'}
                  {relationInfo.stage === 6 && '영원한 사랑을 맹세했어요'}
                </p>
              </div>

              {/* 호감도 게이지 - 모바일 최적화 */}
              <div className="mb-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">호감도 진행률</span>
                  <span className="text-sm font-bold text-gray-900">
                    {relationInfo.score}/1000
                  </span>
                </div>
                <FavorabilityGauge 
                  score={relationInfo.score}
                  stage={relationInfo.stage}
                  maxScore={1000}
                  height={10}
                  showLabel={false}
                />
              </div>
              
              {/* 다음 단계 정보 */}
              {nextStageInfo && (
                <div className="flex justify-between items-center p-3 bg-white/60 rounded-lg">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      다음 단계: {nextStageInfo.nextStageLabel}
                    </span>
                    <div className="text-xs text-gray-500 mt-1">
                      더 깊은 관계로 발전하려면
                    </div>
                  </div>
                  <span className="text-sm font-bold text-pink-600">
                    {nextStageInfo.pointsNeeded}점 남음
                  </span>
                </div>
              )}

              {/* 관계 팁 */}
              <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm">💡</span>
                  <span className="text-sm font-medium text-gray-700">관계 발전 팁</span>
                </div>
                <p className="text-xs text-gray-600">
                  {relationInfo.stage === 0 && '일상적인 대화를 통해 서로를 알아가보세요!'}
                  {relationInfo.stage === 1 && '더 개인적인 이야기를 나누어보세요!'}
                  {relationInfo.stage === 2 && '로맨틱한 분위기를 만들어보세요!'}
                  {relationInfo.stage === 3 && '사랑을 표현하고 데이트를 즐기세요!'}
                  {relationInfo.stage === 4 && '미래를 함께 계획해보세요!'}
                  {relationInfo.stage === 5 && '결혼 준비를 함께 해보세요!'}
                  {relationInfo.stage === 6 && '행복한 결혼 생활을 즐기세요!'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages - 모바일 최적화 */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 space-y-4 bg-gray-50"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}>
            <div className="max-w-xs">
              <div className={`px-4 py-3 rounded-3xl shadow-sm ${
                message.isFromUser
                  ? 'bg-black text-white'
                  : 'bg-white text-gray-900 border border-gray-200'
              }`}>
                <p className="text-base leading-relaxed break-words">
                  {message.content}
                </p>
              </div>
              <div className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'} mt-1`}>
                <p className="text-xs text-gray-500 px-2">
                  {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          </div>
        ))}
        
        {/* 타이핑 애니메이션 표시 - 모바일 최적화 */}
        {isTyping && typingMessage && (
          <div key={`typing-${typingMessage.id}`} className="flex justify-start">
            <div className="max-w-xs">
              <div className="px-4 py-3 rounded-3xl bg-white text-gray-900 border border-gray-200 shadow-sm">
                <p className="text-base leading-relaxed break-words">
                  <TypingAnimation
                    text={typingMessage.content}
                    speed={30}
                    onComplete={handleTypingComplete}
                  />
                </p>
              </div>
              <div className="flex justify-start mt-1">
                <p className="text-xs text-gray-500 px-2">
                  {new Date(typingMessage.createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* 응답 생성 중일 때 로딩 인디케이터 표시 */}
        {isGeneratingResponse && !isTyping && <LoadingIndicator />}
        
        {/* 스크롤 자동 이동을 위한 빈 div */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - 모바일 최적화 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-200 safe-area-bottom">
        <div className="flex items-end space-x-3 px-4 py-4">
          <div className="flex-1">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !heartLoading && hearts >= 1 && !isGeneratingResponse && !sendingMessage && handleSendWithPreventDuplication()}
              onClick={() => hearts < 1 && handleButtonPress('heart-insufficient')}
              placeholder={hearts < 1 ? "하트가 부족합니다! 충전해주세요 💖" : "메시지를 입력하세요..."}
              disabled={hearts < 1 || heartLoading || isGeneratingResponse || sendingMessage}
              className={`w-full px-4 py-3 rounded-3xl text-base transition-all duration-150 ${
                hearts < 1 || heartLoading || isGeneratingResponse || sendingMessage
                  ? 'border-2 border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                  : 'border-2 border-gray-300 bg-white text-gray-900 focus:border-pink-500 focus:ring-2 focus:ring-pink-200'
              }`}
              style={{
                minHeight: '44px',
                fontSize: '16px', // iOS 줌 방지
                WebkitAppearance: 'none'
              }}
            />
            {hearts < 1 && (
              <div className="flex items-center justify-center mt-2">
                <span className="text-sm text-gray-500">💖 1하트 소모</span>
              </div>
            )}
          </div>
          
          <button
            onClick={handleSendWithPreventDuplication}
            disabled={!newMessage.trim() || hearts < 1 || heartLoading || isGeneratingResponse || sendingMessage}
            className={`p-3 rounded-full transition-all duration-150 active:scale-95 ${
              !newMessage.trim() || hearts < 1 || heartLoading || isGeneratingResponse || sendingMessage
                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                : buttonPressed === 'send' 
                  ? 'bg-black text-white scale-95'
                  : 'bg-black text-white hover:bg-gray-800 shadow-lg'
            }`}
            style={{ minWidth: '44px', minHeight: '44px' }}
            onTouchStart={() => handleButtonPress('send')}
            title={hearts < 1 ? '하트가 부족합니다' : '메시지 전송 (1 하트 소모)'}
          >
            {heartLoading || isGeneratingResponse || sendingMessage ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
      
      {/* Favorability Change Notification - 모바일 최적화 */}
      {favorabilityNotification && (
        <div className="fixed top-24 left-4 right-4 z-50">
          <FavorabilityChangeNotification 
            deltaScore={favorabilityNotification.deltaScore}
            oldStage={favorabilityNotification.oldStage}
            newStage={favorabilityNotification.newStage}
            stageChanged={favorabilityNotification.stageChanged}
          />
        </div>
      )}
      </div>
    </div>
  );
};

export default ChatPage; 