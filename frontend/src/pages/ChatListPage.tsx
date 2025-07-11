import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import { chatsAPI } from '../services/api';
import { Chat, ChatDisplayData } from '../types/chat';
import Avatar from '../components/Avatar';

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
      const response = await chatsAPI.getAll();
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

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      const aTime = new Date(a.updatedAt || a.createdAt).getTime();
      const bTime = new Date(b.updatedAt || b.createdAt).getTime();
      return bTime - aTime;
    });
  }, [chats]);

  const formatLastMessage = useCallback((chat: Chat): string => {
    if (!chat.lastMessage) {
      return '대화를 시작해보세요...';
    }
    return chat.lastMessage.length > 30 
      ? `${chat.lastMessage.substring(0, 30)}...` 
      : chat.lastMessage;
  }, []);

  const formatTimeAgo = useCallback((dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric'
    });
  }, []);

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <HeartIcon className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            채팅을 시작하려면 로그인하세요
          </h2>
          <p className="text-gray-600 mb-6">
            AI 친구들과 즐거운 대화를 나눠보세요
          </p>
          <button
            onClick={() => setShowLoginModal(true)}
            className="bg-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors"
          >
            로그인하기
          </button>
        </div>
        {showLoginModal && (
          <LoginModal 
            isOpen={showLoginModal}
            onClose={() => setShowLoginModal(false)}
            title="채팅을 시작하려면 로그인하세요"
            subtitle="AI 친구들과 즐거운 대화를 나눠보세요"
          />
        )}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchChats}
            className="bg-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  if (sortedChats.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center">
          <div className="text-8xl mb-4">💬</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            아직 채팅이 없습니다
          </h2>
          <p className="text-gray-600 mb-6">
            새로운 AI 친구와 대화를 시작해보세요
          </p>
          <button
            onClick={() => navigate('/for-you')}
            className="bg-pink-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-600 transition-colors"
          >
            친구 찾기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen">
      <div className="sticky top-0 bg-white border-b border-gray-100 p-4 z-10">
        <h1 className="text-2xl font-bold text-gray-800">채팅</h1>
        <p className="text-gray-600 text-sm">
          {sortedChats.length}개의 대화
        </p>
      </div>

      <div className="divide-y divide-gray-100">
        {sortedChats.map((chat) => (
          <div
            key={chat.id}
            onClick={() => handleChatClick(chat.id)}
            className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            <div className="flex items-center space-x-3">
              <Avatar
                src={chat.character?.avatarUrl}
                alt={chat.character?.name || 'Unknown'}
                name={chat.character?.name || 'Unknown'}
                size="md"
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-medium text-gray-900 truncate">
                    {chat.character?.name || 'Unknown Character'}
                  </h3>
                  {/* 페르소나 정보 표시 */}
                  <div className="flex items-center space-x-2 flex-shrink-0">
                    {chat.persona ? (
                      <>
                        <span className="text-xs text-gray-500 truncate max-w-[80px]">
                          {chat.persona.name}
                        </span>
                        <Avatar
                          src={chat.persona.avatarUrl}
                          alt={chat.persona.name}
                          name={chat.persona.name}
                          size="sm"
                          className="w-6 h-6"
                        />
                      </>
                    ) : (
                      <>
                        <span className="text-xs text-gray-500">
                          기본
                        </span>
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xs text-gray-500">👤</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
                
                <p className="text-sm text-gray-600 truncate">
                  {formatLastMessage(chat)}
                </p>
                
                {chat.unreadCount && chat.unreadCount > 0 && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(chat.updatedAt || chat.createdAt)}
                    </span>
                    <span className="bg-pink-500 text-white text-xs px-2 py-1 rounded-full">
                      {chat.unreadCount}
                    </span>
                  </div>
                )}
                {!chat.unreadCount && (
                  <div className="mt-1">
                    <span className="text-xs text-gray-400">
                      {formatTimeAgo(chat.updatedAt || chat.createdAt)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChatListPage; 