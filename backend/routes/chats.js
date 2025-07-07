const express = require('express');
const { PrismaClient } = require('@prisma/client');
const favorabilityEngine = require('../services/favorabilityEngine');
const router = express.Router();
const prisma = new PrismaClient();

// OpenAI 설정 (테스트 환경이 아닐 때만)
let openai = null;
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);

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
  console.log('⚠️ OpenAI not initialized - using fallback responses');
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

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
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
        persona: true,
        user: true
      }
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // 기존 대화 히스토리 가져오기 (더 많은 컨텍스트를 위해 확장)
    const messageHistory = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'asc' },
      take: 30 // 최근 30개 메시지로 확장
    });

    // 사용자 메시지 저장
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        userId: firebaseUserId,
        content: content.trim(),
        isFromUser: true
      }
    });

    // AI 응답 생성
    let aiResponse;
    try {
      if (openai) {
        aiResponse = await generateAIResponseWithOpenAI(
          content.trim(), 
          chat.character, 
          chat.persona,
          messageHistory
        );
      } else {
        aiResponse = generateCharacterBasedResponse(content.trim(), chat.character);
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      aiResponse = generateCharacterBasedResponse(content.trim(), chat.character);
    }
    
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

    // 호감도 시스템 처리
    let favorabilityResult = null;
    try {
      favorabilityResult = await favorabilityEngine.processMessage(
        firebaseUserId,
        chat.characterId,
        content.trim(),
        chat.character.personality
      );
      console.log('💖 Favorability updated:', favorabilityResult);
    } catch (error) {
      console.error('❌ Error updating favorability:', error);
      // 호감도 업데이트 실패해도 채팅은 계속 진행
    }

    res.json({
      messages: [userMessage, aiMessage],
      favorability: favorabilityResult
    });
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

    if (!characterId) {
      return res.status(400).json({ error: 'Character ID is required' });
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
    
    // 캐릭터 존재 확인
    const character = await prisma.character.findUnique({
      where: { id: characterId }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }
    
    // 기존 채팅이 있는지 확인
    let chat = await prisma.chat.findFirst({
      where: {
        userId: firebaseUserId,
        characterId,
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
        persona: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
    
    // 기존 채팅이 없으면 새로 생성
    if (!chat) {
      console.log('Creating new chat for user:', firebaseUserId, 'character:', characterId);
      chat = await prisma.chat.create({
        data: {
          userId: firebaseUserId,
          characterId,
          personaId: personaId === 'user' ? null : personaId,
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
      console.log('New chat created:', chat.id);
    } else {
      console.log('Existing chat found:', chat.id);
      // 기존 채팅의 페르소나 업데이트 (필요한 경우)
      if (personaId && personaId !== 'user' && chat.personaId !== personaId) {
        chat = await prisma.chat.update({
          where: { id: chat.id },
          data: { personaId },
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
      }
    }

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Failed to create chat' });
  }
});

// OpenAI를 사용한 AI 응답 생성 함수
async function generateAIResponseWithOpenAI(userMessage, character, persona, messageHistory) {
  try {
    console.log('🤖 Generating OpenAI response for character:', character.name);
    console.log('📝 User message:', userMessage);
    console.log('👤 Persona:', persona?.name || 'None');
    console.log('💬 Message history count:', messageHistory.length);
    
    // 캐릭터 정보 구성 (모든 필드 포함)
    const characterInfo = `
=== 캐릭터 프로필 ===
이름: ${character.name}
나이: ${character.age || '불명'}
성별: ${character.gender === 'male' ? '남성' : character.gender === 'female' ? '여성' : character.gender === 'undisclosed' ? '비공개' : '불명'}
캐릭터 유형: ${character.characterType || '일반인'}
키: ${character.height || '보통'}
MBTI: ${character.mbti || '불명'}

=== 성격 및 특성 ===
성격: ${character.personality || '친근하고 다정함'}
첫인상: ${character.firstImpression || '친근하고 접근하기 쉬운 사람'}
기본 설정: ${character.basicSetting || '일상적인 대화를 즐기는 사람'}
배경 스토리: ${character.background || '평범한 일상을 살아가는 사람'}
캐릭터 설명: ${character.description || '특별한 설명 없음'}

=== 취향 및 특징 ===
좋아하는 것: ${character.likes || '새로운 사람들과의 대화'}
싫어하는 것: ${character.dislikes || '무례한 행동'}
해시태그: ${character.hashtags ? (Array.isArray(character.hashtags) ? character.hashtags.join(', ') : character.hashtags) : '없음'}
무기/특기: ${character.weapons ? (Array.isArray(character.weapons) ? character.weapons.join(', ') : character.weapons) : '없음'}

=== 대화 스타일 ===
폭력적 내용 허용: ${character.allowViolence ? '예' : '아니오'}
상업적 캐릭터: ${character.isCommercial ? '예' : '아니오'}
`;

    // 페르소나 정보 구성 (모든 필드 포함)
    const personaInfo = persona ? `
=== 대화 상대 정보 ===
이름: ${persona.name}
나이: ${persona.age || '불명'}
성별: ${persona.gender === 'male' ? '남성' : persona.gender === 'female' ? '여성' : '비공개'}
직업: ${persona.job || '정보 없음'}
기본 정보: ${persona.basicInfo || '정보 없음'}
외모: ${persona.appearance || '정보 없음'}
성격: ${persona.personality || '정보 없음'}
습관: ${persona.habits || '정보 없음'}

이 사람과의 관계에서 ${character.name}는 상대방의 특성을 고려하여 대화해야 합니다.
` : `
=== 대화 상대 정보 ===
대화 상대는 기본 사용자 프로필을 사용합니다.
상대방에 대한 구체적인 정보가 없으므로, 일반적이고 친근한 대화를 진행하세요.
`;

    // 대화 히스토리 구성 (더 많은 컨텍스트 포함)
    const recentHistory = messageHistory.slice(-12); // 최근 12개로 확장
    const conversationHistory = recentHistory.length > 0 ? 
      recentHistory.map((msg) => {
        const speaker = msg.isFromUser ? (persona?.name || '사용자') : character.name;
        const time = new Date(msg.createdAt).toLocaleString('ko-KR');
        return `[${time}] ${speaker}: ${msg.content}`;
      }).join('\n') : '이전 대화 없음 (새로운 대화 시작)';

    // 고급 시스템 프롬프트 구성
    const systemPrompt = `당신은 ${character.name}라는 캐릭터로서 완전한 롤플레이를 해야 합니다. 
다음 정보를 바탕으로 캐릭터의 성격, 말투, 행동 패턴을 완벽하게 구현하세요.

${characterInfo}

${personaInfo}

=== 대화 규칙 ===
1. 🎭 **캐릭터 일관성**: ${character.name}의 성격과 말투를 절대 벗어나지 마세요
2. 💬 **자연스러운 대화**: 진짜 사람처럼 자연스럽고 몰입감 있는 대화를 만드세요
3. 📝 **적절한 길이**: 응답은 1-3문장으로 적절한 길이로 해주세요
4. 🇰🇷 **한국어 사용**: 자연스러운 한국어로 대화하세요
5. 🎨 **개성 표현**: 캐릭터의 특징과 개성을 살려서 반응하세요
6. 🔄 **연속성 유지**: 이전 대화 내용을 기억하고 연속성을 유지하세요
7. 😊 **감정 표현**: 적절한 감정 표현으로 생동감을 더하세요
8. 🎯 **맞춤형 대화**: 상대방의 페르소나 정보를 고려하여 맞춤형 대화를 하세요
9. 🌟 **창의적 응답**: 예측 가능한 답변보다는 창의적이고 흥미로운 응답을 하세요
10. 💭 **캐릭터 관점**: 항상 ${character.name}의 관점에서 생각하고 반응하세요

=== 이전 대화 기록 ===
${conversationHistory}

=== 현재 상황 ===
${persona?.name || '사용자'}가 "${userMessage}"라고 말했습니다.

이제 ${character.name}의 입장에서 이 메시지에 대해 자연스럽고 캐릭터답게 응답해주세요.
캐릭터의 성격, 말투, 관계성, 그리고 지금까지의 대화 맥락을 모두 고려하여 일관성 있고 흥미로운 응답을 만들어주세요.

중요: 당신은 지금 ${character.name}입니다. AI가 아닌 실제 캐릭터로서 대화하세요.`;

    console.log('🚀 Sending request to OpenAI...');
    
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
      max_tokens: 200, // 응답 길이 조금 늘림
      temperature: 0.9, // 창의성 높임
      presence_penalty: 0.3, // 반복 방지
      frequency_penalty: 0.2, // 다양성 증가
      top_p: 0.95 // 응답 품질 향상
    });

    const response = completion.choices[0].message.content.trim();
    console.log('✅ OpenAI response generated successfully:', response);
    
    // 응답 품질 검증
    if (response.length < 5) {
      console.log('⚠️ Response too short, using fallback');
      return generateCharacterBasedResponse(userMessage, character);
    }
    
    return response;
    
  } catch (error) {
    console.error('❌ OpenAI API Error:', error.message);
    console.error('Error details:', error.response?.data || error);
    throw error;
  }
}

// 캐릭터 기반 응답 생성 함수 (OpenAI 없을 때 사용)
function generateCharacterBasedResponse(userMessage, character) {
  const characterName = character.name || '캐릭터';
  
  console.log('🔄 Using fallback response for character:', characterName);
  
  // 메시지 키워드 기반 응답
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes('안녕') || lowerMessage.includes('하이') || lowerMessage.includes('헬로')) {
    return `안녕하세요! 저는 ${characterName}이에요. 만나서 반가워요! 😊`;
  }
  
  if (lowerMessage.includes('어떻게') || lowerMessage.includes('어떤')) {
    return `음... 좋은 질문이네요! ${characterName}으로서 생각해보면, 정말 흥미로운 주제인 것 같아요.`;
  }
  
  if (lowerMessage.includes('좋아') || lowerMessage.includes('싫어')) {
    return `그런 마음이 드시는군요! 저도 비슷한 생각을 해본 적이 있어요. 더 자세히 이야기해 주실래요?`;
  }
  
  if (lowerMessage.includes('뭐해') || lowerMessage.includes('뭐하고')) {
    return `지금은 당신과 이야기하고 있어요! 정말 즐거운 시간이에요. 당신은 어떤 하루를 보내고 계신가요?`;
  }
  
  if (lowerMessage.includes('고마워') || lowerMessage.includes('감사')) {
    return `천만에요! ${characterName}으로서 도움이 되었다면 정말 기뻐요. 😊`;
  }
  
  if (lowerMessage.includes('미안') || lowerMessage.includes('죄송')) {
    return `괜찮아요! 전혀 신경 쓰지 마세요. 우리 계속 즐겁게 이야기해요!`;
  }
  
  // 기본 응답들 (캐릭터 성격을 고려한 다양한 응답)
  const defaultResponses = [
    `정말 흥미로운 이야기네요! ${characterName}으로서 더 자세히 듣고 싶어요.`,
    `그렇게 생각하시는군요. 저도 비슷한 경험이 있는 것 같아요!`,
    `좋은 질문이에요! 함께 생각해보면 어떨까요?`,
    `와, 정말 멋진 이야기예요! 어떤 기분이셨는지 궁금해요.`,
    `그런 상황이었군요. ${characterName}으로서 정말 공감이 되네요.`,
    `흥미롭네요! 저도 그런 생각을 해본 적이 있어요.`,
    `정말요? 더 자세히 들려주실 수 있나요?`,
    `그런 일이 있었군요. ${characterName}으로서 정말 관심이 생겨요!`
  ];

  return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

module.exports = router; 