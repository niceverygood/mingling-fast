const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// OpenAI 설정 (테스트 환경이 아닐 때만)
let openai = null;
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length);

if (process.env.NODE_ENV !== 'test' && process.env.OPENAI_API_KEY) {
  try {
    const OpenAI = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI initialized successfully');
  } catch (error) {
    console.error('❌ OpenAI initialization failed:', error.message);
  }
} else {
  console.log('❌ OpenAI not initialized - NODE_ENV:', process.env.NODE_ENV, 'API_KEY exists:', !!process.env.OPENAI_API_KEY);
}

// GET /api/chats - 채팅 목록 조회
router.get('/', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // 사용자가 없으면 자동 생성
    let user = await prisma.user.findUnique({
      where: { id: firebaseUserId }
    });
    
    if (!user) {
      console.log('User not found, creating new user:', firebaseUserId);
      user = await prisma.user.create({
        data: {
          id: firebaseUserId,
          username: req.headers['x-user-email']?.split('@')[0] || `사용자_${Date.now()}`,
          email: req.headers['x-user-email'] || null,
          hearts: 150 // 기본 하트
        }
      });
      console.log('New user created:', user.username);
    }

    const chats = await prisma.chat.findMany({
      where: {
        userId: firebaseUserId,
        isActive: true
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        messages: {
          take: 1,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            content: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    // 실제 데이터만 반환 - 더미 데이터 생성 로직 제거
    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Failed to fetch chats' });
  }
});

// GET /api/chats/:chatId/messages - 특정 채팅의 메시지들 조회
router.get('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    
    const messages = await prisma.message.findMany({
      where: {
        chatId
      },
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        content: true,
        isFromUser: true,
        createdAt: true
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// POST /api/chats/:chatId/messages - 새 메시지 전송
router.post('/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;

    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // 사용자가 없으면 자동 생성
    let user = await prisma.user.findUnique({
      where: { id: firebaseUserId }
    });
    
    if (!user) {
      console.log('User not found, creating new user:', firebaseUserId);
      user = await prisma.user.create({
        data: {
          id: firebaseUserId,
          username: req.headers['x-user-email']?.split('@')[0] || `사용자_${Date.now()}`,
          email: req.headers['x-user-email'] || null,
          hearts: 150 // 기본 하트
        }
      });
      console.log('New user created:', user.username);
    }

    // 채팅 정보와 캐릭터 정보 가져오기
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        character: true,
        persona: true, // 채팅에 연결된 페르소나
        user: true
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // 기존 대화 히스토리 가져오기
    const messageHistory = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: 20 // 최근 20개 메시지만
    });

    // 사용자 메시지 저장
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        userId: firebaseUserId,
        content,
        isFromUser: true
      }
    });

    // AI 응답 생성 (OpenAI 사용)
    const aiResponse = await generateAIResponseWithOpenAI(
      content, 
      chat.character, 
      chat.persona, // 채팅에 연결된 페르소나 사용 (없으면 null)
      messageHistory
    );
    
    const aiMessage = await prisma.message.create({
      data: {
        chatId,
        userId: firebaseUserId,
        content: aiResponse,
        isFromUser: false
      }
    });

    // 채팅의 마지막 메시지 업데이트
    await prisma.chat.update({
      where: { id: chatId },
      data: {
        lastMessage: aiResponse,
        lastMessageAt: new Date()
      }
    });

    res.json([userMessage, aiMessage]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// POST /api/chats - 새 채팅 시작
router.post('/', async (req, res) => {
  try {
    const { characterId, personaId } = req.body;
    
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }
    
    // 사용자가 없으면 자동 생성
    let user = await prisma.user.findUnique({
      where: { id: firebaseUserId }
    });
    
    if (!user) {
      console.log('User not found, creating new user:', firebaseUserId);
      user = await prisma.user.create({
        data: {
          id: firebaseUserId,
          username: req.headers['x-user-email']?.split('@')[0] || `사용자_${Date.now()}`,
          email: req.headers['x-user-email'] || null,
          hearts: 150 // 기본 하트
        }
      });
      console.log('New user created:', user.username);
    }
    
    // personaId 로깅 (나중에 활용 가능)
    if (personaId) {
      console.log('Chat started with persona:', personaId);
    }
    
    const chat = await prisma.chat.create({
      data: {
        userId: firebaseUserId,
        characterId,
        personaId: personaId === 'user' ? null : personaId, // 'user'는 기본 프로필이므로 null로 저장
        lastMessage: '안녕하세요! 새로운 대화를 시작해볼까요?',
        lastMessageAt: new Date()
      },
      include: {
        character: {
          select: {
            id: true,
            name: true,
            avatarUrl: true
          }
        },
        persona: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// OpenAI를 사용한 몰입감 있는 AI 응답 생성 함수
async function generateAIResponseWithOpenAI(userMessage, character, persona, messageHistory) {
  // 테스트 환경이거나 OpenAI가 설정되지 않은 경우 기본 응답 사용
  if (!openai) {
    console.log('OpenAI not configured, using fallback response');
    return generateAIResponse(userMessage);
  }

  try {
    console.log('Generating OpenAI response for character:', character.name);
    
    // 캐릭터 정보 구성
    const characterInfo = `
캐릭터 이름: ${character.name}
나이: ${character.age || '불명'}
성별: ${character.gender === 'male' ? '남성' : character.gender === 'female' ? '여성' : '비공개'}
캐릭터 유형: ${character.characterType || '정보 없음'}
성격: ${character.personality || '정보 없음'}
배경: ${character.background || '정보 없음'}
첫인상: ${character.firstImpression || '정보 없음'}
기본 설정: ${character.basicSetting || '정보 없음'}
좋아하는 것: ${character.likes || '정보 없음'}
싫어하는 것: ${character.dislikes || '정보 없음'}
MBTI: ${character.mbti || '정보 없음'}
키: ${character.height || '정보 없음'}
설명: ${character.description || '정보 없음'}
`;

    // 페르소나 정보 구성 (사용자의 역할)
    const personaInfo = persona ? `
대화 상대 정보 (사용자):
이름: ${persona.name}
나이: ${persona.age || '불명'}
성별: ${persona.gender === 'male' ? '남성' : persona.gender === 'female' ? '여성' : '비공개'}
직업: ${persona.job || '정보 없음'}
기본 정보: ${persona.basicInfo || '정보 없음'}
습관: ${persona.habits || '정보 없음'}
외모: ${persona.appearance || '정보 없음'}
성격: ${persona.personality || '정보 없음'}
` : `
대화 상대 정보 (사용자):
기본 사용자 프로필을 사용 중입니다. 특별한 페르소나 설정은 없습니다.
`;

    // 대화 히스토리 구성 (최근 10개 메시지만)
    const recentHistory = messageHistory.slice(-10);
    const conversationHistory = recentHistory.map(msg => 
      `${msg.isFromUser ? persona?.name || '사용자' : character.name}: ${msg.content}`
    ).join('\n');

    // 시스템 프롬프트 구성
    const systemPrompt = `당신은 ${character.name}라는 캐릭터입니다. 다음 정보를 바탕으로 캐릭터의 성격과 특징을 완벽하게 표현하여 대화하세요.

${characterInfo}

${personaInfo}

대화 규칙:
1. 캐릭터의 성격, 말투, 특징을 일관되게 유지하세요
2. 캐릭터의 배경과 설정에 맞는 반응을 보이세요
3. 자연스럽고 몰입감 있는 대화를 만드세요
4. 캐릭터가 좋아하는 것과 싫어하는 것을 고려하세요
5. 캐릭터의 첫인상과 기본 설정을 반영하세요
6. 대화 상대의 페르소나 정보도 고려하여 적절히 반응하세요
7. 한국어로 자연스럽게 대화하세요
8. 응답은 1-3문장 정도로 간결하고 자연스럽게 해주세요
9. 캐릭터의 유형(${character.characterType || '일반'})에 맞는 말투와 태도를 보여주세요
10. 감정을 표현할 때는 자연스럽고 캐릭터에 맞게 표현하세요

이전 대화 기록:
${conversationHistory}

현재 대화 상대가 "${userMessage}"라고 말했습니다. ${character.name}의 입장에서 이 메시지에 대해 자연스럽고 캐릭터다운 응답을 해주세요.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userMessage
        }
      ],
      max_tokens: 200,
      temperature: 0.9,
      presence_penalty: 0.3,
      frequency_penalty: 0.2
    });

    const response = completion.choices[0].message.content.trim();
    console.log('OpenAI response generated successfully:', response.substring(0, 50) + '...');
    return response;
    
  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    console.log('Falling back to simple response');
    // OpenAI 실패 시 캐릭터 기반 응답
    return generateCharacterBasedResponse(userMessage, character);
  }
}

// 간단한 AI 응답 생성 함수 (백업용)
function generateAIResponse(_userMessage) {
  const responses = [
    '정말 흥미로운 말씀이네요! 더 자세히 이야기해 주실 수 있나요?',
    '그렇게 생각하시는군요. 저도 비슷한 경험이 있는 것 같아요.',
    '좋은 질문이에요. 함께 생각해보면 어떨까요?',
    '와, 정말 멋진 이야기네요! 어떤 기분이셨는지 궁금해요.',
    '그런 상황이었군요. 더 자세히 들려주세요.'
  ];
  
  return responses[Math.floor(Math.random() * responses.length)];
}

// 캐릭터 기반 응답 생성 함수 (OpenAI 실패 시 사용)
function generateCharacterBasedResponse(_userMessage, _character) {
  const defaultResponses = [
    '정말 흥미로운 이야기네요! 더 들려주세요.',
    '그렇게 생각하시는군요. 어떤 기분이셨나요?',
    '좋은 질문이에요! 함께 생각해볼까요?',
    '와, 정말 멋진 아이디어예요.',
    '그런 경험을 하셨군요. 더 자세히 이야기해 주세요.'
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

module.exports = router; 