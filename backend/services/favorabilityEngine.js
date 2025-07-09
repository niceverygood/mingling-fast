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

// AI를 통한 대화 평가 (OpenAI Function Calling 사용)
async function evaluateMessage(message, characterPersonality = '') {
  try {
    const openai = global.openai;
    if (!openai) {
      console.log('⚠️ OpenAI not available, using fallback evaluation');
      return evaluateMessageFallback(message);
    }

    const prompt = `You are a relationship coach analyzing a conversation message.
    
Character personality: ${characterPersonality || 'General friendly character'}
User message: "${message}"

Evaluate this message and return a favorability score change:
- Positive interactions (compliments, empathy, humor, emotional sharing): +5 to +30
- Neutral interactions: 0 to +5
- Negative interactions (rudeness, insensitivity, inappropriate): -5 to -30
- Severe negative (harassment, threats): -30 to -70

Consider:
1. Emotional tone and sentiment
2. Appropriateness and respect
3. Relationship building potential
4. Character personality compatibility

Return only a number between -70 and +50.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: message }
      ],
      max_tokens: 10,
      temperature: 0.3
    });

    const scoreText = response.choices[0]?.message?.content?.trim();
    const score = parseInt(scoreText);
    
    if (isNaN(score)) {
      console.log('⚠️ AI evaluation failed, using fallback');
      return evaluateMessageFallback(message);
    }

    // 범위 제한
    return Math.max(-70, Math.min(50, score));
  } catch (error) {
    console.error('❌ AI evaluation error:', error);
    return evaluateMessageFallback(message);
  }
}

// AI 실패 시 폴백 평가
function evaluateMessageFallback(message) {
  const text = message.toLowerCase();
  
  // 긍정적 키워드
  const positiveWords = ['좋아', '고마워', '사랑', '멋져', '예뻐', '재밌어', '웃겨', '최고'];
  const negativeWords = ['싫어', '짜증', '바보', '멍청', '죽어', '꺼져', '시끄러워'];
  
  let score = 0;
  
  positiveWords.forEach(word => {
    if (text.includes(word)) score += 8;
  });
  
  negativeWords.forEach(word => {
    if (text.includes(word)) score -= 12;
  });
  
  // 길이 보너스 (긴 메시지는 더 많은 관심을 의미)
  if (message.length > 50) score += 3;
  if (message.length > 100) score += 2;
  
  return Math.max(-30, Math.min(25, score));
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

// 대화 메시지 처리
async function processMessage(userId, characterId, userMessage, characterPersonality) {
  try {
    // 감쇠 먼저 적용
    await applyDecay(userId, characterId);
    
    // 메시지 평가
    const deltaScore = await evaluateMessage(userMessage, characterPersonality);
    
    // 호감도 업데이트
    const result = await updateFavorability(
      userId,
      characterId,
      deltaScore,
      deltaScore > 0 ? 'chat_positive' : 'chat_negative',
      `Message evaluation: "${userMessage.substring(0, 50)}${userMessage.length > 50 ? '...' : ''}"`
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