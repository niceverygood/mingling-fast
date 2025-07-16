import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, HeartIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { useHearts } from '../hooks/useHearts';
import Avatar from '../components/Avatar';
import TypingAnimation from '../components/TypingAnimation';
import RelationshipModal from '../components/RelationshipModal';
import CharacterDetail from './CharacterCreation/CharacterDetail';
import { FavorabilityChangeNotification } from '../components/FavorabilityGauge';

// API imports
import * as charactersAPI from '../services/api';
import * as conversationsAPI from '../services/api';
import { heartsAPI, chatsAPI } from '../services/api';
import { getRelationInfo } from '../services/relationshipAPI';
import { openHeartShop, isInApp, listenForHeartUpdates } from '../utils/webview';
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

  // 관계 모달 상태 추가
  const [isRelationshipModalOpen, setIsRelationshipModalOpen] = useState(false);
  
  // 캐릭터 상세 모달 상태 추가
  const [showCharacterDetail, setShowCharacterDetail] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState(null);

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
    if (!characterId) {
      console.warn('⚠️ 캐릭터 ID가 없어 관계 정보를 불러올 수 없습니다.');
      return;
    }

    try {
      console.log('🔄 관계 정보 불러오기 시도:', characterId);
      const relationData = await getRelationInfo(characterId);
      console.log('✅ 관계 정보 불러오기 성공:', relationData);
      
      if (relationData && relationData.data) {
        // 안전한 데이터 검증
        const safeRelationData = {
          score: typeof relationData.data.score === 'number' ? relationData.data.score : 0,
          stage: typeof relationData.data.stage === 'number' ? relationData.data.stage : 0,
          stageChanged: Boolean(relationData.data.stageChanged),
          ...relationData.data
        };
        setRelationInfo(safeRelationData);
      } else {
        // 기본값 설정
        console.log('⚠️ 관계 정보가 없어 기본값으로 설정');
        setRelationInfo({
          score: 0,
          stage: 0,
          stageChanged: false
        });
      }
    } catch (error) {
      console.error('❌ 관계 정보 불러오기 실패:', error);
      // 네트워크 오류와 서버 오류 구분
      if (error.response?.status >= 500) {
        console.error('서버 에러로 관계 정보 로딩 실패');
      } else if (error.code === 'NETWORK_ERROR') {
        console.error('네트워크 에러로 관계 정보 로딩 실패');
      }
      
      // 기본값 설정 (에러 발생 시에도 UI는 정상 표시)
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
      console.log('💎 하트 잔액 조회 시도...');
      const response = await heartsAPI.getBalance();
      if (response.data && typeof response.data.hearts === 'number') {
        setHearts(response.data.hearts);
        console.log('✅ 하트 잔액 조회 성공:', response.data.hearts);
      } else {
        console.warn('⚠️ 하트 잔액 응답 형식 오류:', response.data);
        // 기본값 유지 (현재 hearts 상태값 그대로)
      }
    } catch (error) {
      console.error('❌ 하트 잔액 조회 실패:', error);
      // 네트워크 오류 시 구분
      if (error.response?.status >= 500) {
        console.error('서버 에러로 하트 잔액 조회 실패');
      } else if (error.code === 'NETWORK_ERROR') {
        console.error('네트워크 에러로 하트 잔액 조회 실패');
      }
      // 실패 시 기본값 유지 (현재 hearts 상태값 그대로)
    }
  };

  const fetchChatInfo = async () => {
    if (!chatId) {
      console.warn('⚠️ 채팅 ID가 없어 채팅 정보를 불러올 수 없습니다.');
      return;
    }

    try {
      console.log('🔄 채팅 정보 불러오기 시도:', chatId);
      // 채팅 목록에서 해당 채팅 정보 찾기
      const response = await chatsAPI.getAll();
      if (Array.isArray(response.data)) {
        const chat = response.data.find(c => c.id === chatId);
        if (chat) {
          setChatInfo(chat);
          console.log('✅ 채팅 정보 로딩 성공:', chat.character?.name);
        } else {
          console.warn('⚠️ 해당 채팅을 찾을 수 없습니다:', chatId);
          setChatInfo(null);
        }
      } else {
        console.error('❌ 채팅 목록 응답 형식 오류:', response.data);
        setChatInfo(null);
      }
    } catch (error) {
      console.error('❌ 채팅 정보 로딩 실패:', error);
      // 네트워크 오류 시 사용자에게 알림
      if (error.response?.status >= 500) {
        console.error('서버 에러로 채팅 정보 로딩 실패');
      } else if (error.code === 'NETWORK_ERROR') {
        console.error('네트워크 에러로 채팅 정보 로딩 실패');
      }
      setChatInfo(null);
    }
  };

  const fetchMessages = async () => {
    if (!chatId) {
      console.warn('⚠️ 채팅 ID가 없어 메시지를 불러올 수 없습니다.');
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      console.log('🔄 메시지 불러오기 시도:', chatId);
      const response = await chatsAPI.getMessages(chatId);
      // 응답이 배열인지 확인
      if (Array.isArray(response.data)) {
        setMessages(response.data);
        console.log('✅ 메시지 로딩 성공:', response.data.length, '개');
      } else {
        console.error('❌ 메시지 응답 형식 오류:', response.data);
        setMessages([]);
      }
    } catch (error) {
      console.error('❌ 메시지 로딩 실패:', error);
      // 네트워크 오류 시 사용자에게 알림
      if (error.response?.status >= 500) {
        console.error('서버 에러로 메시지 로딩 실패');
      } else if (error.code === 'NETWORK_ERROR') {
        console.error('네트워크 에러로 메시지 로딩 실패');
      } else if (error.response?.status === 404) {
        console.warn('채팅을 찾을 수 없습니다 - 새로운 채팅일 수 있습니다');
      }
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

  const handleAvatarClick = () => {
    if (chatInfo?.character) {
      setSelectedCharacter(chatInfo.character);
      setShowCharacterDetail(true);
    }
  };

  const handleCloseCharacterDetail = () => {
    setShowCharacterDetail(false);
    setSelectedCharacter(null);
  };

  // 타이핑 애니메이션 완료 처리
  const handleTypingComplete = () => {
    if (typingMessage) {
      setMessages(prevMessages => [...prevMessages, typingMessage]);
      setTypingMessage(null);
      setIsTyping(false);
    }
  };



  // 실제 데이터만 사용 - 더미 하트 수 제거됨

  if (loading) {
    return (
      <div className="max-w-md mx-auto bg-gradient-to-b from-white to-gray-50 min-h-screen">
        <div className="flex justify-center items-center h-screen">
          <div className="text-center">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-gray-200 rounded-full"></div>
              <div className="w-16 h-16 border-4 border-transparent border-t-blue-500 rounded-full animate-spin absolute top-0 left-0"></div>
            </div>
            <p className="text-gray-600 text-base mt-6 font-medium">채팅을 불러오는 중...</p>
            <p className="text-gray-400 text-sm mt-2">잠시만 기다려주세요</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-gradient-to-b from-white to-gray-50 min-h-screen flex flex-col">
      <div 
        ref={containerRef}
        className="flex flex-col flex-1 overflow-hidden"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
      {/* Header - 참고 이미지 스타일 */}
      <div className="flex-shrink-0 bg-white border-b border-gray-100">
        <div className="flex items-center px-4 py-4">
          {/* 뒤로가기 버튼 */}
          <button 
            onClick={handleBack}
            className="flex-shrink-0 p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 active:scale-95"
          >
            <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          
          {/* 중앙 정렬된 캐릭터 정보 */}
          <div className="flex-1 flex flex-col items-center gap-1 min-w-0 mx-4">
            <div className="flex items-center gap-2" onClick={handleAvatarClick}>
              <div className="relative flex-shrink-0">
                <Avatar 
                  src={chatInfo?.character?.avatarUrl}
                  alt={chatInfo?.character?.name}
                  name={chatInfo?.character?.name}
                  size="sm"
                  fallbackType="emoji"
                  className="w-8 h-8 border-2 border-gray-100"
                />
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-400 border border-white rounded-full"></div>
              </div>
              <h1 className="text-base font-semibold text-gray-900 truncate max-w-[120px]">
                {chatInfo?.character?.name || '채팅'}
              </h1>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500 whitespace-nowrap">
              <div className="w-1.5 h-1.5 bg-green-400 rounded-full flex-shrink-0"></div>
              <span className="truncate">실시간 대화</span>
            </div>
          </div>
          
          {/* 오른쪽 하트 카운터와 메뉴 */}
          <div className="flex-shrink-0 flex items-center gap-2">
            <div 
              className={`flex items-center gap-1 px-2 py-1 rounded-full transition-all duration-200 ${
                hearts < 10 
                  ? 'bg-red-50 text-red-600' 
                  : hearts < 50 
                    ? 'bg-amber-50 text-amber-600'
                    : 'bg-pink-50 text-pink-600'
              }`}
              onClick={() => hearts < 1 && handleButtonPress('heart-insufficient')}
            >
              <HeartIcon className="w-3.5 h-3.5" />
              <span className="text-sm font-medium">
                {hearts}
              </span>
            </div>
            
            <button className="p-1.5 rounded-full hover:bg-gray-100 active:bg-gray-200 transition-all duration-200">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01" />
              </svg>
            </button>
            
            {heartLoading && (
              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin opacity-70"></div>
            )}
          </div>
        </div>
      </div>

      {/* Relationship Status Bar - 참고 이미지 스타일 */}
      {relationInfo && (
        <div className="flex-shrink-0 bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 border-b border-gray-100">
          <button
            onClick={() => setIsRelationshipModalOpen(true)}
            className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-white/30 active:bg-white/50 transition-all duration-200 group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="flex-shrink-0 text-lg group-hover:scale-110 transition-transform duration-200">
                {relationInfo.stage === 0 && '👋'}
                {relationInfo.stage === 1 && '😊'}
                {relationInfo.stage === 2 && '😄'}
                {relationInfo.stage === 3 && '💕'}
                {relationInfo.stage === 4 && '💖'}
                {relationInfo.stage === 5 && '💍'}
                {relationInfo.stage === 6 && '👑'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-purple-900">
                  {relationInfo.stage === 0 && '아는 사이'}
                  {relationInfo.stage === 1 && '친구'}
                  {relationInfo.stage === 2 && '썸 전야'}
                  {relationInfo.stage === 3 && '연인'}
                  {relationInfo.stage === 4 && '진지한 관계'}
                  {relationInfo.stage === 5 && '약혼'}
                  {relationInfo.stage === 6 && '결혼'}
                </div>
              </div>
            </div>
            
            <div className="flex-shrink-0 flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-bold text-purple-700">
                  {relationInfo.score}% 
                </div>
                <div className="w-12 h-1 bg-white/50 rounded-full overflow-hidden mt-0.5">
                  <div 
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (relationInfo.score / 1000) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-purple-600 opacity-60 group-hover:opacity-100 transition-opacity text-sm">
                ✨
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Messages - 참고 이미지 스타일 */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-4 py-6 bg-white"
        style={{ 
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[270px] group">
                {!message.isFromUser && (
                  <div className="flex items-center gap-2 mb-1 px-1">
                    <Avatar 
                      src={chatInfo?.character?.avatarUrl}
                      alt={chatInfo?.character?.name}
                      name={chatInfo?.character?.name}
                      size="xs"
                      fallbackType="emoji"
                      className="w-6 h-6"
                    />
                    <span className="text-xs font-medium text-gray-700">
                      {chatInfo?.character?.name}
                    </span>
                  </div>
                )}
                <div className={`px-4 py-3 transition-all duration-200 ${
                  message.isFromUser
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl rounded-br-md shadow-sm group-hover:shadow-md'
                    : 'bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md group-hover:bg-gray-50'
                }`}>
                  <p className="text-sm leading-relaxed break-words">
                    {message.content}
                  </p>
                </div>
                <div className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'} mt-1 px-1`}>
                  <p className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {new Date(message.createdAt).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      hour12: false
                    })}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* 타이핑 애니메이션 표시 - 개선된 디자인 */}
        {isTyping && typingMessage && (
          <div key={`typing-${typingMessage.id}`} className="flex justify-start">
            <div className="max-w-[280px] group">
              <div className="px-4 py-3 rounded-2xl bg-white text-gray-900 border border-gray-200 shadow-sm group-hover:shadow-md transition-all duration-200">
                <p className="text-sm leading-relaxed break-words">
                  <TypingAnimation
                    text={typingMessage.content}
                    speed={30}
                    onComplete={handleTypingComplete}
                  />
                </p>
              </div>
              <div className="flex justify-start mt-1 px-1">
                <p className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  {new Date(typingMessage.createdAt).toLocaleTimeString('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    hour12: false
                  })}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* 응답 생성 중일 때 로딩 인디케이터 표시 - 개선된 디자인 */}
        {isGeneratingResponse && !isTyping && (
          <div className="flex justify-start">
            <div className="max-w-[280px]">
              <div className="px-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-xs text-gray-500">응답 생성 중...</span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 스크롤 자동 이동을 위한 빈 div */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input - 참고 이미지 스타일 */}
      <div className="flex-shrink-0 bg-white border-t border-gray-100 safe-area-bottom">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="flex-shrink-0">
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          </div>
          
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !heartLoading && hearts >= 1 && !isGeneratingResponse && !sendingMessage && handleSendWithPreventDuplication()}
              onClick={() => hearts < 1 && handleButtonPress('heart-insufficient')}
              placeholder={hearts < 1 ? "하트가 부족합니다! 💖" : "메시지를 입력하세요"}
              disabled={hearts < 1 || heartLoading || isGeneratingResponse || sendingMessage}
              className={`w-full px-4 py-3 border rounded-2xl bg-gray-50 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-0 transition-all duration-200 ${
                hearts < 1 || heartLoading || isGeneratingResponse || sendingMessage
                  ? 'border-gray-200 bg-gray-100' 
                  : 'border-gray-200 focus:border-purple-300 focus:bg-white'
              }`}
              style={{
                fontSize: '16px', // iOS 줌 방지
                WebkitAppearance: 'none'
              }}
            />
            
            {hearts < 1 && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-full">💖 1하트 필요</span>
              </div>
            )}
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={handleSendWithPreventDuplication}
              disabled={!newMessage.trim() || hearts < 1 || heartLoading || isGeneratingResponse || sendingMessage}
              className={`p-3 rounded-full transition-all duration-200 active:scale-95 ${
                !newMessage.trim() || hearts < 1 || heartLoading || isGeneratingResponse || sendingMessage
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 shadow-lg hover:shadow-xl'
              }`}
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
      </div>
      
      {/* Favorability Change Notification - 개선된 디자인 */}
      {favorabilityNotification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50 max-w-sm w-full px-4">
          <div className="bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl shadow-xl p-4 animate-in slide-in-from-top-2 fade-in duration-300">
            <FavorabilityChangeNotification 
              deltaScore={favorabilityNotification.deltaScore}
              oldStage={favorabilityNotification.oldStage}
              newStage={favorabilityNotification.newStage}
              stageChanged={favorabilityNotification.stageChanged}
            />
          </div>
        </div>
      )}

      {/* Relationship Modal */}
      <RelationshipModal 
        isOpen={isRelationshipModalOpen}
        onClose={() => setIsRelationshipModalOpen(false)}
        relationInfo={relationInfo}
        characterInfo={chatInfo?.character}
      />

      {/* Character Detail Modal */}
      {showCharacterDetail && selectedCharacter && (
        <CharacterDetail
          characterId={selectedCharacter.id}
          onClose={handleCloseCharacterDetail}
          onEdit={() => {}} // 편집 기능은 비활성화
        />
      )}
      </div>
    </div>
  );
};

export default ChatPage; 