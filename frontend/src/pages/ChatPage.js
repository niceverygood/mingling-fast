import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, HeartIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ChatPage = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  // eslint-disable-next-line no-unused-vars
  const { isLoggedIn, user: authUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatInfo, setChatInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hearts, setHearts] = useState(150);
  const [heartLoading, setHeartLoading] = useState(false);

  useEffect(() => {
    if (chatId) {
      fetchChatInfo();
      fetchMessages();
      fetchHeartBalance();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatId]);

  const fetchHeartBalance = async () => {
    try {
      const response = await axios.get('/api/hearts/balance');
      setHearts(response.data.hearts);
    } catch (error) {
      console.error('Error fetching heart balance:', error);
      // 실패 시 기본값 유지
    }
  };

  const fetchChatInfo = async () => {
    try {
      // 채팅 목록에서 해당 채팅 정보 찾기
      const response = await axios.get('/api/chats');
      const chat = response.data.find(c => c.id === chatId);
      setChatInfo(chat);
    } catch (error) {
      console.error('Error fetching chat info:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await axios.get(`/api/chats/${chatId}/messages`);
      setMessages(response.data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    // 하트가 부족한 경우
    if (hearts < 1) {
      alert('하트가 부족합니다. 하트를 충전해주세요!');
      return;
    }

    setHeartLoading(true);

    try {
      // 하트 차감
      const heartResponse = await axios.post('/api/hearts/spend', {
        amount: 1,
        description: '채팅 메시지 전송'
      });

      // 메시지 전송
      const messageResponse = await axios.post(`/api/chats/${chatId}/messages`, {
        content: newMessage
      });
      
      setMessages([...messages, ...messageResponse.data]);
      setNewMessage('');
      setHearts(heartResponse.data.hearts); // 업데이트된 하트 수 반영
    } catch (error) {
      console.error('Error sending message:', error);
      if (error.response?.data?.error === 'Insufficient hearts') {
        alert('하트가 부족합니다. 하트를 충전해주세요!');
      } else {
        alert('메시지 전송에 실패했습니다.');
      }
    } finally {
      setHeartLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/chats');
  };

  const getHeartCount = (characterName) => {
    const heartCounts = {
      '루나': 280,
      '아이아': 450
    };
    return heartCounts[characterName] || 280;
  };

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
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
              {chatInfo?.character?.avatarUrl ? (
                <img 
                  src={chatInfo.character.avatarUrl} 
                  alt={chatInfo.character.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <span className="text-lg">🤖</span>
              )}
            </div>
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

      {/* Character Info Section */}
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
            {chatInfo?.character?.avatarUrl ? (
              <img 
                src={chatInfo.character.avatarUrl} 
                alt={chatInfo.character.name}
                className="w-6 h-6 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm">🤖</span>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">😊</span>
            <span className="text-sm text-green-600 font-medium">기본 신뢰</span>
            <div className="flex items-center space-x-1">
              <HeartIcon className="w-4 h-4 text-green-500" />
              <span className="text-sm text-gray-600">{getHeartCount(chatInfo?.character?.name)}</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center">
          <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
            {chatInfo?.character?.avatarUrl ? (
              <img 
                src={chatInfo.character.avatarUrl} 
                alt="프로필"
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <span className="text-sm">👤</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div key={message.id}>
            <div className={`flex ${message.isFromUser ? 'justify-end' : 'justify-start'} mb-1`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl ${
                message.isFromUser
                  ? 'bg-black text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}>
                <p className="text-sm leading-relaxed">{message.content}</p>
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
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-200 p-4 bg-white">
        <div className="flex items-center space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !heartLoading && hearts >= 1 && handleSendMessage()}
            placeholder={hearts < 1 ? "하트가 부족합니다. 하트를 충전해주세요!" : "메시지를 입력하세요... (1 하트 소모)"}
            disabled={hearts < 1 || heartLoading}
            className={`flex-1 p-3 border rounded-full focus:outline-none focus:ring-2 text-sm ${
              hearts < 1 || heartLoading 
                ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed' 
                : 'border-gray-300 focus:ring-blue-500'
            }`}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() || hearts < 1 || heartLoading}
            className="p-3 bg-gray-600 text-white rounded-full hover:bg-gray-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            title={hearts < 1 ? '하트가 부족합니다' : '메시지 전송 (1 하트 소모)'}
          >
            {heartLoading ? (
              <div className="w-5 h-5 border border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <PaperAirplaneIcon className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage; 