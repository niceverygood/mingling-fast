const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 호감도 단계 정의
const STAGES = {
  0: { label: 'Acquaintance', min: 0, max: 149, description: '아는 사람' },
  1: { label: 'Casual Friend', min: 150, max: 299, description: '친구' },
  2: { label: 'Close Friend', min: 300, max: 499, description: '썸 전야' },
  3: { label: 'Dating', min: 500, max: 699, description: '연인' },
  4: { label: 'Serious', min: 700, max: 849, description: '진지한 관계' },
  5: { label: 'Engaged', min: 850, max: 929, description: '약혼' },
  6: { label: 'Married', min: 930, max: 1000, description: '결혼' }
};

const GRACE_BUFFER = 20; // 단계 전환 버퍼

// 점수로 단계 계산
function getStage(score) {
  for (let stage = 6; stage >= 0; stage--) {
    if (score >= STAGES[stage].min) {
      return stage;
    }
  }
  return 0;
}

// 단계 전환 시 버퍼 적용
function shouldChangeStage(currentStage, newStage, currentScore) {
  if (newStage === currentStage) return false;
  
  // 상승하는 경우: 새 단계의 최소값 + 버퍼를 넘어야 함
  if (newStage > currentStage) {
    return currentScore >= STAGES[newStage].min + GRACE_BUFFER;
  }
  
  // 하강하는 경우: 현재 단계의 최소값 - 버퍼 아래로 떨어져야 함
  if (newStage < currentStage) {
    return currentScore < STAGES[currentStage].min - GRACE_BUFFER;
  }
  
  return false;
}

// AI를 통한 종합적 대화 평가 (누적 대화 + 현재 메시지)
async function evaluateMessage(userMessage, characterPersonality = '', messageHistory = [], currentRelation = null) {
  try {
    const openai = global.openai;
    if (!openai) {
      console.log('⚠️ OpenAI not available, using fallback evaluation');
      return evaluateMessageFallback(userMessage);
    }

    console.log('🧠 AI 관계 분석 시작...');
    console.log('📝 현재 메시지:', userMessage.substring(0, 50) + '...');
    console.log('💬 대화 히스토리:', messageHistory.length, '개');
    console.log('💖 현재 관계:', currentRelation ? `${currentRelation.score}점 (${STAGES[currentRelation.stage]?.label})` : '신규');

    // 대화 히스토리 요약 (최근 10개 메시지)
    const recentHistory = messageHistory.slice(-10);
    const conversationSummary = recentHistory.length > 0 ? 
      recentHistory.map((msg, index) => {
        const speaker = msg.isFromUser ? '사용자' : '캐릭터';
        return `${index + 1}. ${speaker}: ${msg.content}`;
      }).join('\n') : '처음 대화';

    // 현재 관계 정보
    const relationshipContext = currentRelation ? `
현재 관계 상태:
- 호감도 점수: ${currentRelation.score}/1000
- 관계 단계: ${STAGES[currentRelation.stage]?.label} (${STAGES[currentRelation.stage]?.description})
- 총 대화 수: ${currentRelation.totalMessages || 0}회
- 마지막 상호작용: ${currentRelation.lastEventAt || '처음'}
` : '새로운 관계 시작';

    const prompt = `당신은 인간관계 전문가로서 대화를 종합적으로 분석하여 관계 발전도를 평가합니다.

=== 캐릭터 성격 ===
${characterPersonality || '일반적인 친근한 성격'}

=== 현재 관계 상황 ===
${relationshipContext}

=== 최근 대화 히스토리 ===
${conversationSummary}

=== 현재 사용자 메시지 ===
"${userMessage}"

다음 기준으로 종합적으로 평가하여 관계 점수 변화량을 결정해주세요:

1. **대화의 깊이와 질** (0~25점)
   - 표면적 대화: 0~5점
   - 개인적 관심사 공유: 6~15점 
   - 감정적 교감: 16~25점

2. **관계 발전 기여도** (0~25점)
   - 관계 유지: 0~5점
   - 친밀감 증진: 6~15점
   - 신뢰/유대감 강화: 16~25점

3. **캐릭터와의 궁합** (0~20점)
   - 성격 불일치: -10~0점
   - 보통 호환성: 1~10점
   - 완벽한 궁합: 11~20점

4. **대화 일관성과 맥락** (0~15점)
   - 이전 대화 무시: -5~0점
   - 적절한 연결: 1~8점
   - 완벽한 연속성: 9~15점

5. **감정적 영향** (-30~15점)
   - 부정적 감정 유발: -30~-1점
   - 중립적: 0점
   - 긍정적 감정: 1~15점

**특별 고려사항:**
- 현재 관계 단계에 맞는 적절성
- 대화의 자연스러움과 진정성
- 미래 관계 발전 가능성
- 부적절하거나 해로운 내용은 큰 감점

**최종 점수 범위: -50 ~ +100**
- 관계 악화: -50 ~ -1
- 현상 유지: 0 ~ 5  
- 소폭 발전: 6 ~ 20
- 중간 발전: 21 ~ 50
- 큰 발전: 51 ~ 80
- 극적 발전: 81 ~ 100

분석 과정을 간단히 설명하고 최종 점수만 숫자로 반환해주세요.

예시 형식:
"대화 분석: 사용자가 개인적인 고민을 솔직하게 공유하여 감정적 교감이 깊어짐. 캐릭터 성격과도 잘 맞으며 관계 발전에 크게 기여함. 최종 점수: 45"`;

    console.log('🤖 OpenAI로 관계 분석 요청 중...');
    
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: '당신은 인간관계 분석 전문가입니다. 대화를 종합적으로 분석하여 관계 발전도를 정확히 평가해주세요.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 200,
      temperature: 0.3
    });

    const analysisResult = response.choices[0]?.message?.content?.trim();
    console.log('🧠 AI 분석 결과:', analysisResult);
    
    // 점수 추출 (마지막 숫자를 찾기)
    const scoreMatch = analysisResult.match(/(-?\d+)(?=\s*$|[^\d]*$)/);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : null;
    
    if (isNaN(score)) {
      console.log('⚠️ AI 점수 추출 실패, 폴백 사용');
      return evaluateMessageFallback(userMessage);
    }

    // 범위 제한 (-50 ~ 100)
    const finalScore = Math.max(-50, Math.min(100, score));
    
    console.log('✅ AI 평가 완료:', {
      원본점수: score,
      최종점수: finalScore,
      분석: analysisResult.substring(0, 100) + '...'
    });

    return finalScore;
  } catch (error) {
    console.error('❌ AI 관계 분석 오류:', error);
    return evaluateMessageFallback(userMessage);
  }
}

// AI 실패 시 폴백 평가 (개선된 버전)
function evaluateMessageFallback(message) {
  console.log('🔄 폴백 평가 시스템 사용');
  
  const text = message.toLowerCase();
  
  // 더 정교한 키워드 분석
  const strongPositive = ['사랑해', '너무 좋아', '최고야', '완벽해', '멋져', '예뻐'];
  const positiveWords = ['좋아', '고마워', '재밌어', '웃겨', '기뻐', '행복', '즐거워'];
  const neutralWords = ['어떻게', '뭐해', '그래서', '그런데', '음'];
  const negativeWords = ['싫어', '짜증', '화나', '별로', '지겨워'];
  const strongNegative = ['죽어', '꺼져', '바보', '멍청', '시끄러워'];
  
  let score = 0;
  
  // 강한 긍정
  strongPositive.forEach(word => {
    if (text.includes(word)) score += 15;
  });
  
  // 일반 긍정  
  positiveWords.forEach(word => {
    if (text.includes(word)) score += 8;
  });
  
  // 중립
  neutralWords.forEach(word => {
    if (text.includes(word)) score += 2;
  });
  
  // 부정
  negativeWords.forEach(word => {
    if (text.includes(word)) score -= 8;
  });
  
  // 강한 부정
  strongNegative.forEach(word => {
    if (text.includes(word)) score -= 20;
  });
  
  // 메시지 길이 보너스
  if (message.length > 30) score += 3;
  if (message.length > 100) score += 5;
  if (message.length > 200) score += 7;
  
  // 질문 보너스 (관심 표현)
  if (text.includes('?') || text.includes('뭐') || text.includes('어떻게')) {
    score += 5;
  }
  
  return Math.max(-30, Math.min(40, score));
}

// 호감도 관계 가져오기 또는 생성
async function getOrCreateRelation(userId, characterId) {
  try {
    let relation = await prisma.relation.findUnique({
      where: {
        userId_characterId: {
          userId,
          characterId
        }
      }
    });

    if (!relation) {
      relation = await prisma.relation.create({
        data: {
          userId,
          characterId,
          score: 0,
          stage: 0
        }
      });
    }

    return relation;
  } catch (error) {
    console.error('❌ Error getting/creating relation:', error);
    throw error;
  }
}

// 호감도 업데이트
async function updateFavorability(userId, characterId, deltaScore, eventType, description, messageId = null) {
  try {
    const relation = await getOrCreateRelation(userId, characterId);
    const oldScore = relation.score;
    const oldStage = relation.stage;
    
    // 새 점수 계산 (0-1000 범위 제한)
    const newScore = Math.max(0, Math.min(1000, oldScore + deltaScore));
    const newStage = getStage(newScore);
    
    // 단계 변경 확인 (버퍼 적용)
    const shouldChange = shouldChangeStage(oldStage, newStage, newScore);
    const finalStage = shouldChange ? newStage : oldStage;
    
    // 관계 업데이트 (메시지 카운트도 함께 업데이트)
    const updateData = {
      score: newScore,
      stage: finalStage,
      updatedAt: new Date()
    };
    
    // 메시지 처리인 경우 totalMessages 증가
    if (eventType.includes('chat')) {
      updateData.totalMessages = { increment: 1 };
      updateData.lastEventAt = new Date();
    }
    
    const updatedRelation = await prisma.relation.update({
      where: { id: relation.id },
      data: updateData
    });

    // 이벤트 로그 기록
    await prisma.relationEventLog.create({
      data: {
        relationId: relation.id,
        eventType,
        deltaScore,
        description: description || `Score changed from ${oldScore} to ${newScore}`,
        messageId
      }
    });

    // 단계 변경 이벤트 반환 (상세 정보 포함)
    const stageChanged = shouldChange;
    const result = {
      relation: {
        ...updatedRelation,
        // 정확한 점수와 단계 정보 보장
        score: newScore,
        stage: finalStage
      },
      oldStage,
      newStage: finalStage,
      stageChanged,
      deltaScore,
      stageInfo: STAGES[finalStage],
      score: newScore, // 실제 점수 포함
      // 다음 단계 정보 추가
      nextStageInfo: finalStage < 6 ? {
        nextStage: finalStage + 1,
        nextStageMin: STAGES[finalStage + 1]?.min || 1000,
        pointsNeeded: Math.max(0, (STAGES[finalStage + 1]?.min || 1000) - newScore)
      } : null
    };

    if (stageChanged) {
      console.log(`🎉 Stage changed for user ${userId} with character ${characterId}: ${STAGES[oldStage].label} → ${STAGES[finalStage].label}`);
    }

    console.log(`💖 Favorability updated: ${oldScore} → ${newScore} (${deltaScore > 0 ? '+' : ''}${deltaScore})`);

    return result;
  } catch (error) {
    console.error('❌ Error updating favorability:', error);
    throw error;
  }
}

// 감쇠 처리 (72시간 후)
async function applyDecay(userId, characterId) {
  try {
    const relation = await prisma.relation.findUnique({
      where: {
        userId_characterId: {
          userId,
          characterId
        }
      }
    });

    if (!relation) return null;

    const now = new Date();
    const lastDecay = new Date(relation.lastDecayAt);
    const hoursSinceDecay = (now - lastDecay) / (1000 * 60 * 60);

    if (hoursSinceDecay >= 72) {
      const stage = relation.stage;
      const decayAmount = Math.min(stage * 2 + 2, 10); // 단계별 2-10 포인트 감쇠
      
      if (relation.score > 0) {
        return await updateFavorability(
          userId,
          characterId,
          -decayAmount,
          'decay',
          `Decay applied after ${Math.floor(hoursSinceDecay)} hours of inactivity`
        );
      }
    }

    return null;
  } catch (error) {
    console.error('❌ Error applying decay:', error);
    return null;
  }
}

// 대화 메시지 처리 (개선된 버전)
async function processMessage(userId, characterId, userMessage, characterPersonality) {
  try {
    console.log('💭 관계 점수 분석 시작...');
    
    // 현재 관계 정보 조회
    const currentRelation = await getOrCreateRelation(userId, characterId);
    
    // 최근 대화 히스토리 가져오기 (최대 20개)
    const messageHistory = await prisma.message.findMany({
      where: {
        chat: {
          userId: userId,
          characterId: characterId
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        content: true,
        isFromUser: true,
        createdAt: true
      }
    });

    // 감쇠 먼저 적용
    await applyDecay(userId, characterId);
    
    // AI를 통한 종합적 메시지 평가
    const deltaScore = await evaluateMessage(
      userMessage, 
      characterPersonality, 
      messageHistory.reverse(), // 시간순 정렬
      currentRelation
    );
    
    console.log('📊 관계 점수 변화:', deltaScore);
    
    // 호감도 업데이트
    const result = await updateFavorability(
      userId,
      characterId,
      deltaScore,
      deltaScore > 0 ? 'chat_positive' : 'chat_negative',
      `AI 종합 분석: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"`
    );

    return result;
  } catch (error) {
    console.error('❌ Error processing message:', error);
    throw error;
  }
}

// 특별 이벤트 처리
async function processSpecialEvent(userId, characterId, eventType, deltaScore, description) {
  try {
    const result = await updateFavorability(
      userId,
      characterId,
      deltaScore,
      eventType,
      description
    );

    return result;
  } catch (error) {
    console.error('❌ Error processing special event:', error);
    throw error;
  }
}

// 관계 정보 조회
async function getRelationInfo(userId, characterId) {
  try {
    const relation = await getOrCreateRelation(userId, characterId);
    const stageInfo = STAGES[relation.stage];
    
    return {
      ...relation,
      stageInfo,
      progressInStage: relation.score - stageInfo.min,
      maxProgressInStage: stageInfo.max - stageInfo.min + 1
    };
  } catch (error) {
    console.error('❌ Error getting relation info:', error);
    throw error;
  }
}

module.exports = {
  STAGES,
  processMessage,
  processSpecialEvent,
  getRelationInfo,
  updateFavorability,
  applyDecay,
  getStage
}; 