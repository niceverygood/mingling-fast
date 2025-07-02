import React, { useState, useEffect } from 'react';
import { conversationsAPI } from '../services/api';

const ConversationList = ({ characterId, personaId }) => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchConversations();
  }, [characterId, personaId]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const filters = {};
      if (characterId) filters.characterId = characterId;
      if (personaId) filters.personaId = personaId;
      
      const response = await conversationsAPI.getAll(filters);
      setConversations(response.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setError('대화 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewConversation = async () => {
    if (!characterId) {
      alert('캐릭터를 선택해주세요.');
      return;
    }

    try {
      const conversationData = {
        characterId,
        personaId: personaId || 'user'
      };
      
      const response = await conversationsAPI.create(conversationData);
      setConversations([response.data, ...conversations]);
    } catch (err) {
      console.error('Error creating conversation:', err);
      alert('새 대화를 시작하는데 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <span className="ml-2 text-gray-600">대화 목록을 불러오는 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchConversations}
          className="mt-2 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          대화 목록
          {characterId && (
            <span className="text-sm text-gray-500 ml-2">
              (특정 캐릭터)
            </span>
          )}
          {personaId && (
            <span className="text-sm text-gray-500 ml-2">
              (특정 페르소나)
            </span>
          )}
        </h2>
        
        {characterId && (
          <button
            onClick={handleStartNewConversation}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            새 대화 시작
          </button>
        )}
      </div>

      {/* Conversation List */}
      <div className="divide-y divide-gray-200">
        {conversations.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">대화가 없습니다</h3>
            <p className="text-gray-500 mb-4">
              {characterId 
                ? '이 캐릭터와의 대화를 시작해보세요' 
                : '캐릭터를 선택하고 대화를 시작해보세요'
              }
            </p>
            {characterId && (
              <button
                onClick={handleStartNewConversation}
                className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                첫 대화 시작하기
              </button>
            )}
          </div>
        ) : (
          conversations.map((conversation) => (
            <div key={conversation.id} className="p-4 hover:bg-gray-50 cursor-pointer">
              <div className="flex items-center space-x-3">
                {/* Character Avatar */}
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  {conversation.character?.avatarUrl ? (
                    <img 
                      src={conversation.character.avatarUrl} 
                      alt={conversation.character.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-lg">🤖</span>
                  )}
                </div>

                {/* Conversation Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium text-gray-900 truncate">
                      {conversation.character?.name}
                    </h3>
                    {conversation.persona && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        as {conversation.persona.name}
                      </span>
                    )}
                  </div>
                  
                  {conversation.messages && conversation.messages.length > 0 && (
                    <p className="text-sm text-gray-500 truncate mt-1">
                      {conversation.messages[0].content}
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-400 mt-1">
                    {conversation.lastMessageAt ? 
                      new Date(conversation.lastMessageAt).toLocaleString('ko-KR') :
                      '대화 시작'
                    }
                  </p>
                </div>

                {/* Message Count */}
                {conversation.messages && (
                  <div className="text-xs text-gray-400">
                    {conversation.messages.length > 0 ? 
                      `${conversation.messages.length} 메시지` : 
                      '새 대화'
                    }
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ConversationList; 