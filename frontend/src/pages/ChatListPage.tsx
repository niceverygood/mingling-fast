import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import axios, { AxiosResponse } from 'axios';
import { Chat, ChatDisplayData } from '../types/chat';

// 더미 데이터 제거됨 - 실제 API 데이터만 사용

const ChatListPage: React.FC = () => {
  const { isLoggedIn } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      fetchChats();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchChats = async (): Promise<void> => {
    try {
      setError(null);
      const response: AxiosResponse<Chat[]> = await axios.get('/api/chats');
      if (Array.isArray(response.data)) {
        setChats(response.data);
      } else {
        console.warn('API response is not an array:', response.data);
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError('채팅을 불러오는 중 오류가 발생했습니다.');
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (chatId: number): void => {
    navigate(`/chat/${chatId}`);
  };

  const formatTimeAgo = useCallback((date: string): string => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInMinutes = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}시간 전`;
    if (diffInMinutes < 10080) return `${Math.floor(diffInMinutes / 1440)}일 전`;
    if (diffInMinutes < 43200) return `${Math.floor(diffInMinutes / 10080)}주 전`;
    return `${Math.floor(diffInMinutes / 43200)}개월 전`;
  }, []);

  // 실제 채팅 데이터를 샘플 데이터 구조로 변환
  const formatChatData = useCallback((chatData: Chat): ChatDisplayData => {
    return {
      id: chatData.id,
      character: {
        name: chatData.character?.name || '익명',
        avatarUrl: chatData.character?.avatarUrl || '',
        status: '대화상대'
      },
      lastMessage: chatData.lastMessage || '대화를 시작해보세요',
      lastMessageAt: chatData.lastMessageAt ? formatTimeAgo(chatData.lastMessageAt) : '방금 전',
      unreadCount: chatData.unreadCount || 0,
      heartCount: chatData.heartCount || 100,
      emotion: chatData.emotion || '새로운 친구',
      emotionColor: chatData.emotionColor || 'text-blue-500'
    };
  }, [formatTimeAgo]);

  const displayChats: ChatDisplayData[] = useMemo(() => {
    return isLoggedIn && Array.isArray(chats) && chats.length > 0 
      ? chats.map(formatChatData) 
      : []; // 더미 데이터 제거 - 실제 데이터만 표시
  }, [isLoggedIn, chats, formatChatData]);

  const handleLoginModalClose = (): void => {
    setShowLoginModal(false);
  };

  const handleRetryFetch = (): void => {
    fetchChats();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold text-black">밍글링</h1>
        <p className="text-sm text-gray-500 mt-1">AI 캐릭터와의 대화</p>
      </div>

      {/* Login Banner for non-logged users */}
      {!isLoggedIn && (
        <div className="mx-6 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-blue-600">🔒</span>
            <h3 className="font-medium text-blue-900">로그인하고 AI 캐릭터와 실제로 대화해보세요</h3>
          </div>
          <button 
            onClick={() => setShowLoginModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-600"
          >
            로그인
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mx-6 mb-6 bg-red-50 p-4 rounded-xl border border-red-200">
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-red-600">⚠️</span>
            <p className="text-red-900">{error}</p>
          </div>
          <button 
            onClick={handleRetryFetch}
            className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-600"
          >
            다시 시도
          </button>
        </div>
      )}

      {/* Chat List */}
      <div className="px-6 space-y-4">
        {displayChats.map((chat) => (
          <div 
            key={chat.id} 
            className={`bg-white rounded-2xl border border-gray-100 p-4 ${isLoggedIn ? 'hover:bg-gray-50 cursor-pointer' : 'relative'}`}
            onClick={isLoggedIn ? () => handleChatClick(chat.id) : undefined}
            role={isLoggedIn ? "button" : undefined}
            tabIndex={isLoggedIn ? 0 : undefined}
            onKeyDown={isLoggedIn ? (e) => e.key === 'Enter' && handleChatClick(chat.id) : undefined}
          >
            <div className="flex items-start space-x-3">
              {/* Left Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                  {chat.character.avatarUrl ? (
                    <img 
                      src={chat.character.avatarUrl} 
                      alt={chat.character.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-purple-600 text-lg font-bold">
                      {chat.character.name.charAt(0)}
                    </span>
                  )}
                </div>
                {/* Unread Badge */}
                {chat.unreadCount > 0 && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-medium">{chat.unreadCount}</span>
                  </div>
                )}
              </div>

              {/* Chat Content */}
              <div className="flex-1 min-w-0">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-black text-base">{chat.character.name}</h3>
                    <span className="text-gray-400 text-sm">👀</span>
                    <span className="text-gray-400 text-sm">{chat.character.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400 text-sm">{chat.lastMessageAt}</span>
                    {/* Right Avatar */}
                    <div className="w-8 h-8 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                      <span className="text-gray-600 text-xs">👤</span>
                    </div>
                  </div>
                </div>

                {/* Message Preview */}
                <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                  {chat.lastMessage}
                </p>

                {/* Bottom Row - Emotion and Hearts */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-1">
                    <span className="text-base">😊</span>
                    <span className={`text-sm font-medium ${chat.emotionColor}`}>
                      {chat.emotion}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HeartIcon className={`w-4 h-4 ${chat.emotionColor}`} />
                    <span className="text-sm font-medium text-gray-700">{chat.heartCount}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlay for non-logged users */}
            {!isLoggedIn && (
              <div className="absolute inset-0 bg-white bg-opacity-60 rounded-2xl flex items-center justify-center">
                <button 
                  onClick={() => setShowLoginModal(true)}
                  className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-gray-800"
                >
                  로그인하고 대화하기
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State for logged users with no chats */}
      {isLoggedIn && Array.isArray(chats) && chats.length === 0 && !error && (
        <div className="text-center py-16 px-6">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300 text-4xl">
            💬
          </div>
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            아직 대화가 없어요
          </h4>
          <p className="text-gray-500 mb-6">
            AI 캐릭터와 첫 대화를 시작해보세요!
          </p>
        </div>
      )}

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={handleLoginModalClose}
        title="채팅방에 들어가려면 로그인하세요"
        subtitle="저장된 채팅을 보려면 로그인이 필요해요"
      />
    </div>
  );
};

export default ChatListPage; 