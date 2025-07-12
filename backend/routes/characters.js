const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// GET /api/characters - 모든 공개 캐릭터 목록
router.get('/', async (req, res) => {
  try {
    const characters = await prisma.character.findMany({
      where: {
        isPublic: true
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        age: true,
        characterType: true,
        gender: true,
        firstImpression: true,
        createdAt: true,
        user: {
          select: {
            username: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(characters);
  } catch (error) {
    console.error('Error fetching characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// GET /api/characters/my - 내가 만든 캐릭터 목록
router.get('/my', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    const characters = await prisma.character.findMany({
      where: {
        userId: firebaseUserId
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        age: true,
        characterType: true,
        gender: true,
        firstImpression: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(characters);
  } catch (error) {
    console.error('Error fetching my characters:', error);
    res.status(500).json({ error: 'Failed to fetch characters' });
  }
});

// GET /api/characters/recommended - 추천 캐릭터 목록 (For You)
router.get('/recommended', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'];
    
    console.log('🔍 추천 캐릭터 요청:', { 
      userId: firebaseUserId,
      timestamp: new Date().toISOString()
    });
    
    // 공개 캐릭터 모두 포함 (자신이 만든 것도 포함)
    const whereClause = {
      isPublic: true
    };

    const characters = await prisma.character.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        age: true,
        personality: true,
        firstImpression: true,
        basicSetting: true,
        characterType: true,
        gender: true,
        background: true,
        mbti: true,
        height: true,
        likes: true,
        dislikes: true,
        hashtags: true,
        hashtagCode: true,
        userId: true,
        createdAt: true,
        user: {
          select: {
            username: true
          }
        }
      },
      take: 50, // 더 많은 캐릭터 로드
      orderBy: [
        // 자신이 만든 캐릭터를 우선적으로 표시
        ...(firebaseUserId 
          ? [{ userId: { equals: firebaseUserId } }] 
          : []),
        { createdAt: 'desc' }
      ]
    });

    // 캐릭터 데이터 후처리 및 최적화
    const optimizedCharacters = characters.map(character => {
      // 소유자 정보 추가
      const isOwner = character.userId === firebaseUserId;
      
      // 이미지 URL 최적화 (S3 URL 처리)
      let optimizedAvatarUrl = character.avatarUrl;
      if (optimizedAvatarUrl && !optimizedAvatarUrl.startsWith('http')) {
        optimizedAvatarUrl = `https://mingling-uploads.s3.ap-northeast-2.amazonaws.com/${optimizedAvatarUrl}`;
      }
      
      // 첫인상 데이터 우선순위 처리
      let displayFirstImpression = character.firstImpression;
      if (!displayFirstImpression) {
        // firstImpression이 없으면 다른 필드로 대체
        displayFirstImpression = character.description || character.personality || character.basicSetting;
      }
      
      // 성격 정보 최적화
      let displayPersonality = character.personality;
      if (!displayPersonality && character.mbti) {
        displayPersonality = character.mbti;
      }
      
      return {
        id: character.id,
        name: character.name,
        description: character.description,
        avatarUrl: optimizedAvatarUrl,
        age: character.age,
        personality: displayPersonality,
        firstImpression: displayFirstImpression,
        basicSetting: character.basicSetting,
        characterType: character.characterType,
        gender: character.gender,
        background: character.background,
        mbti: character.mbti,
        height: character.height,
        likes: character.likes,
        dislikes: character.dislikes,
        hashtags: character.hashtags,
        hashtagCode: character.hashtagCode,
        isOwner,
        createdAt: character.createdAt,
        user: character.user
      };
    });

    // 캐릭터 순서 최적화 (다양성 보장)
    const shuffledCharacters = shuffleArray(optimizedCharacters);
    
    console.log('✅ 추천 캐릭터 응답:', { 
      totalCharacters: shuffledCharacters.length,
      userCharacters: shuffledCharacters.filter(c => c.isOwner).length,
      publicCharacters: shuffledCharacters.filter(c => !c.isOwner).length,
      hasFirstImpressions: shuffledCharacters.filter(c => c.firstImpression).length
    });

    res.json(shuffledCharacters);
  } catch (error) {
    console.error('❌ 추천 캐릭터 조회 실패:', error);
    res.status(500).json({ error: 'Failed to fetch recommended characters' });
  }
});

// GET /api/characters/for-you - 포유페이지용 랜덤 6개 캐릭터
router.get('/for-you', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'];
    const excludeIds = req.query.exclude ? req.query.exclude.split(',').map(id => parseInt(id)) : [];
    
    console.log('🎯 For You 캐릭터 요청:', { 
      userId: firebaseUserId,
      excludeIds: excludeIds.length,
      timestamp: new Date().toISOString()
    });

    // 공개 캐릭터 중에서 제외할 ID를 제외하고 가져오기
    const whereClause = {
      isPublic: true,
      ...(excludeIds.length > 0 && {
        id: {
          notIn: excludeIds
        }
      })
    };

    // 총 캐릭터 수 확인
    const totalCount = await prisma.character.count({
      where: { isPublic: true }
    });

    // 사용 가능한 캐릭터 수 확인
    const availableCount = await prisma.character.count({
      where: whereClause
    });

    console.log('📊 캐릭터 통계:', { totalCount, availableCount, excludeCount: excludeIds.length });

    let characters;
    const targetCount = 6;

    if (availableCount >= targetCount) {
      // 충분한 캐릭터가 있는 경우: 랜덤 선택
      const skipCount = Math.floor(Math.random() * Math.max(1, availableCount - targetCount + 1));
      
      characters = await prisma.character.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          avatarUrl: true,
          age: true,
          personality: true,
          firstImpression: true,
          basicSetting: true,
          characterType: true,
          gender: true,
          background: true,
          mbti: true,
          height: true,
          likes: true,
          dislikes: true,
          hashtags: true,
          hashtagCode: true,
          userId: true,
          createdAt: true,
          user: {
            select: {
              username: true
            }
          }
        },
        skip: skipCount,
        take: targetCount,
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 결과가 6개 미만이면 추가로 가져오기
      if (characters.length < targetCount) {
        const remainingCount = targetCount - characters.length;
        const additionalCharacters = await prisma.character.findMany({
          where: whereClause,
          select: {
            id: true,
            name: true,
            description: true,
            avatarUrl: true,
            age: true,
            personality: true,
            firstImpression: true,
            basicSetting: true,
            characterType: true,
            gender: true,
            background: true,
            mbti: true,
            height: true,
            likes: true,
            dislikes: true,
            hashtags: true,
            hashtagCode: true,
            userId: true,
            createdAt: true,
            user: {
              select: {
                username: true
              }
            }
          },
          take: remainingCount,
          orderBy: {
            createdAt: 'asc'
          }
        });
        characters = [...characters, ...additionalCharacters];
      }
    } else {
      // 사용 가능한 캐릭터가 부족한 경우: 모든 공개 캐릭터에서 랜덤 선택
      console.log('⚠️ 사용 가능한 캐릭터 부족, 전체에서 선택');
      
      const allCharacters = await prisma.character.findMany({
        where: { isPublic: true },
        select: {
          id: true,
          name: true,
          description: true,
          avatarUrl: true,
          age: true,
          personality: true,
          firstImpression: true,
          basicSetting: true,
          characterType: true,
          gender: true,
          background: true,
          mbti: true,
          height: true,
          likes: true,
          dislikes: true,
          hashtags: true,
          hashtagCode: true,
          userId: true,
          createdAt: true,
          user: {
            select: {
              username: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      // 셔플 후 6개 선택
      const shuffled = shuffleArray(allCharacters);
      characters = shuffled.slice(0, targetCount);
    }

    // 캐릭터 데이터 최적화
    const optimizedCharacters = characters.map(character => {
      const isOwner = character.userId === firebaseUserId;
      
      let optimizedAvatarUrl = character.avatarUrl;
      if (optimizedAvatarUrl && !optimizedAvatarUrl.startsWith('http')) {
        optimizedAvatarUrl = `https://mingling-uploads.s3.ap-northeast-2.amazonaws.com/${optimizedAvatarUrl}`;
      }
      
      let displayFirstImpression = character.firstImpression;
      if (!displayFirstImpression) {
        displayFirstImpression = character.description || character.personality || character.basicSetting;
      }
      
      let displayPersonality = character.personality;
      if (!displayPersonality && character.mbti) {
        displayPersonality = character.mbti;
      }
      
      return {
        id: character.id,
        name: character.name,
        description: character.description,
        avatarUrl: optimizedAvatarUrl,
        age: character.age,
        personality: displayPersonality,
        firstImpression: displayFirstImpression,
        basicSetting: character.basicSetting,
        characterType: character.characterType,
        gender: character.gender,
        background: character.background,
        mbti: character.mbti,
        height: character.height,
        likes: character.likes,
        dislikes: character.dislikes,
        hashtags: character.hashtags,
        hashtagCode: character.hashtagCode,
        isOwner,
        createdAt: character.createdAt,
        user: character.user
      };
    });

    // 다음 정시까지 남은 시간 계산
    const now = new Date();
    const nextHour = new Date(now);
    nextHour.setHours(now.getHours() + 1, 0, 0, 0);
    const timeUntilNextRefresh = nextHour.getTime() - now.getTime();

    const response = {
      characters: optimizedCharacters,
      refreshInfo: {
        nextRefreshAt: nextHour.toISOString(),
        timeUntilRefresh: timeUntilNextRefresh,
        minutesUntilRefresh: Math.floor(timeUntilNextRefresh / (1000 * 60)),
        secondsUntilRefresh: Math.floor((timeUntilNextRefresh % (1000 * 60)) / 1000)
      },
      metadata: {
        totalCharacters: totalCount,
        availableCharacters: availableCount,
        excludedCharacters: excludeIds.length,
        returnedCharacters: optimizedCharacters.length
      }
    };

    console.log('✅ For You 캐릭터 응답:', {
      charactersCount: optimizedCharacters.length,
      nextRefresh: nextHour.toISOString(),
      minutesUntilRefresh: response.refreshInfo.minutesUntilRefresh
    });

    res.json(response);
  } catch (error) {
    console.error('❌ For You 캐릭터 조회 실패:', error);
    res.status(500).json({ error: 'Failed to fetch for-you characters' });
  }
});

// POST /api/characters/for-you/add - 하트로 캐릭터 추가
router.post('/for-you/add', async (req, res) => {
  try {
    const firebaseUserId = req.headers['x-user-id'];
    const { excludeIds = [] } = req.body;
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    console.log('💎 하트로 캐릭터 추가 요청:', { 
      userId: firebaseUserId,
      excludeIds: excludeIds.length,
      timestamp: new Date().toISOString()
    });

    // 하트 잔액 확인
    const user = await prisma.user.findUnique({
      where: { id: firebaseUserId },
      select: { hearts: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.hearts < 5) {
      return res.status(400).json({ 
        error: 'Insufficient hearts',
        required: 5,
        current: user.hearts
      });
    }

    // 하트 차감
    await prisma.user.update({
      where: { id: firebaseUserId },
      data: {
        hearts: {
          decrement: 5
        }
      }
    });

    // 하트 사용 기록
    await prisma.heartTransaction.create({
      data: {
        userId: firebaseUserId,
        amount: -5,
        type: 'spend',
        description: 'For You 캐릭터 추가 추천'
      }
    });

    // 새로운 캐릭터 1개 선택 (제외 목록 제외)
    const whereClause = {
      isPublic: true,
      ...(excludeIds.length > 0 && {
        id: {
          notIn: excludeIds.map(id => parseInt(id))
        }
      })
    };

    const availableCount = await prisma.character.count({ where: whereClause });
    
    let newCharacter;
    if (availableCount > 0) {
      const skipCount = Math.floor(Math.random() * availableCount);
      
      const characters = await prisma.character.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          avatarUrl: true,
          age: true,
          personality: true,
          firstImpression: true,
          basicSetting: true,
          characterType: true,
          gender: true,
          background: true,
          mbti: true,
          height: true,
          likes: true,
          dislikes: true,
          hashtags: true,
          hashtagCode: true,
          userId: true,
          createdAt: true,
          user: {
            select: {
              username: true
            }
          }
        },
        skip: skipCount,
        take: 1,
        orderBy: {
          createdAt: 'desc'
        }
      });

      newCharacter = characters[0];
    } else {
      // 제외할 캐릭터가 없는 경우 전체에서 랜덤 선택
      const allCharacters = await prisma.character.findMany({
        where: { isPublic: true },
        select: {
          id: true,
          name: true,
          description: true,
          avatarUrl: true,
          age: true,
          personality: true,
          firstImpression: true,
          basicSetting: true,
          characterType: true,
          gender: true,
          background: true,
          mbti: true,
          height: true,
          likes: true,
          dislikes: true,
          hashtags: true,
          hashtagCode: true,
          userId: true,
          createdAt: true,
          user: {
            select: {
              username: true
            }
          }
        }
      });

      if (allCharacters.length > 0) {
        newCharacter = allCharacters[Math.floor(Math.random() * allCharacters.length)];
      }
    }

    if (!newCharacter) {
      return res.status(404).json({ error: 'No characters available' });
    }

    // 캐릭터 데이터 최적화
    const isOwner = newCharacter.userId === firebaseUserId;
    
    let optimizedAvatarUrl = newCharacter.avatarUrl;
    if (optimizedAvatarUrl && !optimizedAvatarUrl.startsWith('http')) {
      optimizedAvatarUrl = `https://mingling-uploads.s3.ap-northeast-2.amazonaws.com/${optimizedAvatarUrl}`;
    }
    
    let displayFirstImpression = newCharacter.firstImpression;
    if (!displayFirstImpression) {
      displayFirstImpression = newCharacter.description || newCharacter.personality || newCharacter.basicSetting;
    }
    
    let displayPersonality = newCharacter.personality;
    if (!displayPersonality && newCharacter.mbti) {
      displayPersonality = newCharacter.mbti;
    }

    const optimizedCharacter = {
      id: newCharacter.id,
      name: newCharacter.name,
      description: newCharacter.description,
      avatarUrl: optimizedAvatarUrl,
      age: newCharacter.age,
      personality: displayPersonality,
      firstImpression: displayFirstImpression,
      basicSetting: newCharacter.basicSetting,
      characterType: newCharacter.characterType,
      gender: newCharacter.gender,
      background: newCharacter.background,
      mbti: newCharacter.mbti,
      height: newCharacter.height,
      likes: newCharacter.likes,
      dislikes: newCharacter.dislikes,
      hashtags: newCharacter.hashtags,
      hashtagCode: newCharacter.hashtagCode,
      isOwner,
      createdAt: newCharacter.createdAt,
      user: newCharacter.user
    };

    // 업데이트된 하트 잔액 조회
    const updatedUser = await prisma.user.findUnique({
      where: { id: firebaseUserId },
      select: { hearts: true }
    });

    console.log('✅ 하트로 캐릭터 추가 완료:', {
      characterId: optimizedCharacter.id,
      characterName: optimizedCharacter.name,
      heartsSpent: 5,
      remainingHearts: updatedUser.hearts
    });

    res.json({
      character: optimizedCharacter,
      heartsSpent: 5,
      remainingHearts: updatedUser.hearts
    });

  } catch (error) {
    console.error('❌ 하트로 캐릭터 추가 실패:', error);
    res.status(500).json({ error: 'Failed to add character with hearts' });
  }
});

// 배열 셔플 유틸리티 함수
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// POST /api/characters - 새 캐릭터 생성 (최적화된 버전)
router.post('/', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { 
      name, age, description, personality, avatarUrl, characterType,
      background, mbti, height, likes, dislikes, hashtags, gender,
      firstImpression, basicSetting, allowViolence, backupChats,
      hashtagCode, isPublic, weapons, isCommercial
    } = req.body;

    // 입력 데이터 검증 강화
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    if (name.length > 15) {
      return res.status(400).json({ error: 'Name must be 15 characters or less' });
    }
    
    if (!avatarUrl || avatarUrl.trim() === '') {
      return res.status(400).json({ error: 'Avatar image is required' });
    }
    
    const firebaseUserId = req.headers['x-user-id'];
    const firebaseUserEmail = req.headers['x-user-email'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    console.log('🎭 캐릭터 생성 시작:', { 
      userId: firebaseUserId, 
      characterName: name.trim(),
      hasAvatar: !!avatarUrl,
      startTime: new Date().toISOString()
    });

    // 사용자 정보 조회 또는 생성 (최적화된 upsert)
    let user = await prisma.user.findUnique({
      where: { id: firebaseUserId },
      select: { id: true, username: true }
    });

    if (!user) {
      console.log('👤 사용자 자동 생성 중...', { firebaseUserId, firebaseUserEmail });
      
      try {
        const safeEmail = firebaseUserEmail || `${firebaseUserId}@auto.mingling`;
        const baseUsername = firebaseUserEmail?.split('@')[0] || 'user';
        const safeUsername = `${baseUsername}_${Date.now()}`;
        
        user = await prisma.user.upsert({
          where: { id: firebaseUserId },
          update: {},
          create: {
            id: firebaseUserId,
            email: safeEmail,
            username: safeUsername,
            hearts: 150
          },
          select: { id: true, username: true }
        });
        
        console.log('✅ 사용자 생성 완료:', { userId: user.id, username: user.username });
      } catch (createError) {
        console.error('❌ 사용자 생성 실패:', createError);
        return res.status(500).json({ 
          error: '사용자 생성에 실패했습니다. 다시 로그인해주세요.',
          details: createError.message
        });
      }
    }
    
    // 캐릭터 데이터 정제 및 생성
    const characterData = {
      name: name.trim(),
      age: age?.trim() || null,
      description: description?.trim() || null,
      personality: personality?.trim() || null,
      avatarUrl: avatarUrl.trim(),
      characterType: characterType || null,
      background: background?.trim() || null,
      mbti: mbti?.trim() || null,
      height: height?.trim() || null,
      likes: likes?.trim() || null,
      dislikes: dislikes?.trim() || null,
      hashtags: Array.isArray(hashtags) ? hashtags : (hashtags ? [hashtags] : undefined),
      gender: gender || 'undisclosed',
      firstImpression: firstImpression?.trim() || null,
      basicSetting: basicSetting?.trim() || null,
      weapons: Array.isArray(weapons) ? weapons.filter(w => w?.trim()) : undefined,
      isCommercial: Boolean(isCommercial),
      allowViolence: Boolean(allowViolence),
      backupChats: backupChats !== false,
      hashtagCode: hashtagCode?.trim() || `#${name.trim()}`,
      isPublic: isPublic !== false,
      userId: firebaseUserId
    };

    const character = await prisma.character.create({
      data: characterData,
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        age: true,
        characterType: true,
        gender: true,
        firstImpression: true,
        createdAt: true
      }
    });

    const processTime = Date.now() - startTime;
    console.log('✅ 캐릭터 생성 완료:', { 
      characterId: character.id, 
      name: character.name,
      userId: firebaseUserId,
      processTime: `${processTime}ms`
    });

    res.status(201).json(character);
  } catch (error) {
    const processTime = Date.now() - startTime;
    console.error('❌ 캐릭터 생성 실패:', {
      error: error.message,
      stack: error.stack,
      processTime: `${processTime}ms`,
      userId: req.headers['x-user-id']
    });
    
    // 사용자 친화적 에러 메시지
    let errorMessage = '캐릭터 생성에 실패했습니다.';
    if (error.code === 'P2002') {
      errorMessage = '이미 존재하는 정보입니다. 다른 이름을 사용해주세요.';
    } else if (error.message.includes('timeout')) {
      errorMessage = '요청 시간이 초과되었습니다. 다시 시도해주세요.';
    }
    
    res.status(500).json({ 
      error: errorMessage, 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET /api/characters/types - 캐릭터 유형 목록
router.get('/types', async (req, res) => {
  try {
    const characterTypes = [
      '애니메이션 & 만화 주인공',
      '개인 캐릭터', 
      '순수창작 캐릭터',
      '셀럽브리티',
      '영화 & 드라마 주인공',
      '버튜버',
      '기타'
    ];
    
    res.json(characterTypes);
  } catch (error) {
    console.error('Error fetching character types:', error);
    res.status(500).json({ error: 'Failed to fetch character types' });
  }
});

// GET /api/characters/hashtags - 해시태그 카테고리별 목록
router.get('/hashtags', async (req, res) => {
  try {
    const hashtagCategories = {
      성격: [
        '#친근한', '#따뜻한', '#차분한', '#활발한', 
        '#유머러스한', '#진지한', '#귀여운', '#섹시한', 
        '#지적인', '#감성적인'
      ],
      관계: [
        '#연인', '#친구', '#멘토', '#상담사',
        '#선생님', '#동료', '#가족', '#코치'
      ],
      취미: [
        '#독서', '#영화', '#음악', '#게임',
        '#운동', '#요리', '#여행', '#사진'
      ],
      직업: [
        '#의사', '#교사', '#개발자', '#배우',
        '#가수', '#요리사', '#변호사', '#아티스트',
        '#그림', '#슈퍼히어로', '#전범죄', '#진보적'
      ]
    };
    
    res.json(hashtagCategories);
  } catch (error) {
    console.error('Error fetching hashtags:', error);
    res.status(500).json({ error: 'Failed to fetch hashtags' });
  }
});

// GET /api/characters/:id - 특정 캐릭터 조회
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const character = await prisma.character.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        age: true,
        description: true,
        personality: true,
        avatarUrl: true,
        characterType: true,
        background: true,
        mbti: true,
        height: true,
        likes: true,
        dislikes: true,
        hashtags: true,
        gender: true,
        firstImpression: true,
        basicSetting: true,
        allowViolence: true,
        backupChats: true,
        hashtagCode: true,
        isPublic: true,
        weapons: true,
        isCommercial: true,
        createdAt: true,
        user: {
          select: {
            username: true
          }
        }
      }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    res.json(character);
  } catch (error) {
    console.error('Error fetching character:', error);
    res.status(500).json({ error: 'Failed to fetch character' });
  }
});

// PUT /api/characters/:id - 캐릭터 수정
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      age, 
      description, 
      personality, 
      avatarUrl,
      characterType,
      background,
      mbti,
      height,
      likes,
      dislikes,
      hashtags,
      gender,
      firstImpression,
      basicSetting,
      allowViolence,
      backupChats,
      hashtagCode,
      isPublic,
      weapons,
      isCommercial
    } = req.body;

    // 이름은 필수
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }

    const updatedCharacter = await prisma.character.update({
      where: { id },
      data: {
        name: name.trim(),
        age: age?.trim() || null,
        description: description?.trim() || null,
        personality: personality?.trim() || null,
        avatarUrl: avatarUrl || null,
        characterType: characterType || null,
        background: background?.trim() || null,
        mbti: mbti?.trim() || null,
        height: height?.trim() || null,
        likes: likes?.trim() || null,
        dislikes: dislikes?.trim() || null,
        hashtags: hashtags || undefined,
        gender: gender || 'undisclosed',
        firstImpression: firstImpression?.trim() || null,
        basicSetting: basicSetting?.trim() || null,
        weapons: weapons || undefined,
        isCommercial: isCommercial || false,
        allowViolence: allowViolence || false,
        backupChats: backupChats !== false,
        hashtagCode: hashtagCode?.trim() || null,
        isPublic: isPublic !== false
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        age: true,
        characterType: true,
        gender: true,
        firstImpression: true,
        createdAt: true
      }
    });

    res.json(updatedCharacter);
  } catch (error) {
    console.error('Error updating character:', error);
    res.status(500).json({ error: 'Failed to update character' });
  }
});

// DELETE /api/characters/:id - 캐릭터 삭제
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const firebaseUserId = req.headers['x-user-id'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    console.log(`🗑️ 캐릭터 삭제 시작: ${id} by user ${firebaseUserId}`);

    // 캐릭터 존재 및 소유권 확인
    const character = await prisma.character.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        userId: true,
        avatarUrl: true,
        _count: {
          select: {
            chats: true,
            relations: true
          }
        }
      }
    });

    if (!character) {
      return res.status(404).json({ error: 'Character not found' });
    }

    if (character.userId !== firebaseUserId) {
      return res.status(403).json({ error: 'You can only delete your own characters' });
    }

    // 관련 데이터가 있는지 확인
    const hasRelatedData = character._count.chats > 0 || character._count.relations > 0;
    
    console.log(`📊 캐릭터 관련 데이터:`, {
      chats: character._count.chats,
      relations: character._count.relations,
      hasRelatedData
    });

    // S3에서 이미지 삭제를 위한 함수 import
    const { deleteFileFromS3 } = require('../config/s3');

    // 트랜잭션으로 모든 데이터 삭제
    const result = await prisma.$transaction(async (tx) => {
      // 1. 관계 관련 데이터 삭제
      if (character._count.relations > 0) {
        // 관계 성취 삭제
        await tx.relationAchievement.deleteMany({
          where: {
            relation: {
              characterId: id
            }
          }
        });

        // 관계 추억 삭제
        await tx.relationMemory.deleteMany({
          where: {
            relation: {
              characterId: id
            }
          }
        });

        // 관계 이벤트 로그 삭제
        await tx.relationEventLog.deleteMany({
          where: {
            relation: {
              characterId: id
            }
          }
        });

        // 관계 삭제
        await tx.relation.deleteMany({
          where: { characterId: id }
        });
      }

      // 2. 채팅 관련 데이터 삭제
      if (character._count.chats > 0) {
        // 메시지 삭제
        await tx.message.deleteMany({
          where: {
            chat: {
              characterId: id
            }
          }
        });

        // 채팅 삭제
        await tx.chat.deleteMany({
          where: { characterId: id }
        });
      }

      // 3. 캐릭터 삭제
      await tx.character.delete({
        where: { id }
      });

      return { 
        type: 'deleted',
        message: '캐릭터가 완전히 삭제되었습니다.',
        deletedData: {
          chats: character._count.chats,
          relations: character._count.relations
        }
      };
    });

    // 4. S3에서 이미지 삭제 (트랜잭션 외부에서 실행)
    if (character.avatarUrl) {
      try {
        await deleteFileFromS3(character.avatarUrl);
        console.log(`🖼️ S3 이미지 삭제 완료: ${character.avatarUrl}`);
      } catch (s3Error) {
        console.error('⚠️ S3 이미지 삭제 실패 (무시하고 계속):', s3Error);
        // S3 삭제 실패는 치명적이지 않으므로 무시
      }
    }

    console.log(`✅ 캐릭터 삭제 완료:`, {
      characterId: id,
      characterName: character.name,
      deletedData: result.deletedData
    });

    res.json({
      success: true,
      data: {
        id,
        name: character.name,
        ...result
      }
    });

  } catch (error) {
    console.error('❌ Error deleting character:', error);
    
    let errorMessage = 'Failed to delete character';
    if (error.code === 'P2003') {
      errorMessage = 'Cannot delete character due to existing dependencies';
    } else if (error.code === 'P2025') {
      errorMessage = 'Character not found';
    }
    
    res.status(500).json({ 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 