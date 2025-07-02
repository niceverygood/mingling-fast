import React, { useState, useEffect } from 'react';
import { HeartIcon } from '@heroicons/react/24/solid';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginModal from '../components/LoginModal';
import axios from 'axios';

const ChatListPage = () => {
  const { isLoggedIn } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn) {
      fetchChats();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const fetchChats = async () => {
    try {
      const response = await axios.get('/api/chats');
      // 응답이 배열인지 확인
      if (Array.isArray(response.data)) {
        setChats(response.data);
      } else {
        console.warn('API response is not an array:', response.data);
        setChats([]);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      // API 실패 시 빈 배열로 설정
      setChats([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChatClick = (chatId) => {
    navigate(`/chat/${chatId}`);
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const messageDate = new Date(date);
    const diffInHours = Math.floor((now - messageDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return '방금 전';
    } else if (diffInHours < 24) {
      return `${diffInHours}시간 전`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}일 전`;
    }
  };

  const getHeartCount = (characterName) => {
    // 임시로 하드코딩된 하트 수 (실제로는 API에서 가져와야 함)
    const heartCounts = {
      '아이아': 450,
      '루나': 280
    };
    return heartCounts[characterName] || 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-gray-500">로딩 중...</div>
      </div>
    );
  }

  // 로그인하지 않은 경우 게스트 화면
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto bg-white min-h-screen pb-20">
        {/* Header */}
        <div className="px-4 pt-12 pb-4">
          <h1 className="text-2xl font-bold text-black">밍글링</h1>
          <p className="text-sm text-gray-500 mt-1">AI 캐릭터와의 대화</p>
        </div>

        {/* Login CTA Banner */}
        <div className="mx-4 mb-6 bg-blue-50 p-4 rounded-xl border border-blue-200">
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

        {/* Sample Chat Items (Preview) */}
        <div className="divide-y divide-gray-100 opacity-60">
          <div className="px-4 py-4 relative">
            <div className="flex items-start space-x-3">
              {/* Avatar with Online Status */}
              <div className="relative">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🤖</span>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">2</span>
                </div>
              </div>

              {/* Chat Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-black">아이아</h3>
                    <span className="text-sm text-gray-400">👀</span>
                    <span className="text-sm text-gray-400">민수</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">14시간 전</span>
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm">👤</span>
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                  세 번째 정말 좋아요! 인생 콘텐츠 하실 예정이시다가?
                </p>

                {/* Emoji and Heart Count */}
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">😊</span>
                    <span className="text-sm font-medium text-blue-500">어느 시절</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="w-4 h-4 text-pink-500" />
                    <span className="text-sm text-gray-600">50</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Overlay to indicate login required */}
            <div className="absolute inset-0 bg-white bg-opacity-50 flex items-center justify-center">
              <button 
                onClick={() => setShowLoginModal(true)}
                className="bg-black text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg hover:bg-gray-800"
              >
                로그인하고 대화하기
              </button>
            </div>
          </div>

          {/* Additional sample chat items */}
          {[
            { name: '설록 홈즈', status: '이춘희', time: '2시간 전', hearts: 75, emotion: '어는 시절' },
            { name: '고무 탬지', status: '요리 초보', time: '1일 전', hearts: 76, emotion: '어는 시절' },
            { name: '헤르미온느', status: '학생', time: '6시간 전', hearts: 70, emotion: '어는 시절' },
            { name: '엠사', status: '여행가', time: '12시간 전', hearts: 67, emotion: '어는 시절' }
          ].map((chat, index) => (
            <div key={index} className="px-4 py-4 relative">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">🤖</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-black">{chat.name}</h3>
                      <span className="text-sm text-gray-400">👀</span>
                      <span className="text-sm text-gray-400">{chat.status}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-400">{chat.time}</span>
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm">👤</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                    어떤 방법의 거북을 중심이 정말 어떻네마. 믿을 성실 구걸하고 싶어요
                  </p>

                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-1">
                      <span className="text-lg">😊</span>
                      <span className="text-sm font-medium text-green-500">{chat.emotion}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <HeartIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-600">{chat.hearts}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="absolute inset-0 bg-white bg-opacity-50"></div>
            </div>
          ))}
        </div>

        {/* Login Modal */}
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          title="채팅방에 들어가려면 로그인하세요"
          subtitle="저장된 채팅을 보려면 로그인이 필요해요"
        />
      </div>
    );
  }

  // 로그인한 경우 기존 코드 유지
  return (
    <div className="max-w-md mx-auto bg-white min-h-screen pb-20">
      {/* Header */}
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-2xl font-bold text-black">밍글링</h1>
        <p className="text-sm text-gray-500 mt-1">AI 캐릭터와의 대화</p>
      </div>

      {/* Chat List */}
      <div className="divide-y divide-gray-100">
        {Array.isArray(chats) && chats.map((chat) => (
          <div 
            key={chat.id} 
            className="px-4 py-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => handleChatClick(chat.id)}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar with Online Status */}
              <div className="relative">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  {chat.character.avatarUrl ? (
                    <img 
                      src={chat.character.avatarUrl} 
                      alt={chat.character.name} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-lg">🤖</span>
                  )}
                </div>
                {/* Online Status Indicator */}
                {chat.character.name === '아이아' && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">1</span>
                  </div>
                )}
              </div>

              {/* Chat Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-black">{chat.character.name}</h3>
                    <span className="text-sm text-gray-400">👀</span>
                    <span className="text-sm text-gray-400">
                      {chat.character.name === '아이아' ? '민수' : '지훈'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-400">
                      {formatTimeAgo(chat.lastMessageAt)}
                    </span>
                    <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                      {chat.character.avatarUrl ? (
                        <img 
                          src={chat.character.avatarUrl} 
                          alt="대화상대" 
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="text-white text-sm">👤</span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-gray-600 mt-1 text-sm line-clamp-2">
                  {chat.lastMessage}
                </p>

                {/* Emoji and Heart Count */}
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <span className="text-lg">😊</span>
                    <span 
                      className={`text-sm font-medium ${
                        chat.character.name === '아이아' ? 'text-blue-500' : 'text-green-500'
                      }`}
                    >
                      {chat.character.name === '아이아' ? '진한 친구' : '가벼운 친구'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <HeartIcon className="w-4 h-4 text-pink-500" />
                    <span className="text-sm text-gray-600">
                      {getHeartCount(chat.character.name)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State (if no chats) */}
      {Array.isArray(chats) && chats.length === 0 && (
        <div className="text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 text-gray-300">
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
    </div>
  );
};

export default ChatListPage; 