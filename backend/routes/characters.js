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
    
    // 공개 캐릭터 중에서 현재 사용자가 만든 것은 제외
    const whereClause = {
      isPublic: true
    };
    
    // 로그인한 사용자인 경우 자신의 캐릭터는 제외
    if (firebaseUserId) {
      whereClause.userId = {
        not: firebaseUserId
      };
    }

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
        user: {
          select: {
            username: true
          }
        }
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    });

    // 더미 데이터 제거 - 실제 데이터만 반환

    res.json(characters);
  } catch (error) {
    console.error('Error fetching recommended characters:', error);
    res.status(500).json({ error: 'Failed to fetch recommended characters' });
  }
});

// POST /api/characters - 새 캐릭터 생성 (확장된 버전)
router.post('/', async (req, res) => {
  try {
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
    
    const firebaseUserId = req.headers['x-user-id'];
    const firebaseUserEmail = req.headers['x-user-email'];
    
    if (!firebaseUserId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // 사용자가 없으면 생성
    let user = await prisma.user.findUnique({
      where: { id: firebaseUserId }
    });

    if (!user) {
      console.log('👤 캐릭터 생성 중 사용자 자동 생성:', { firebaseUserId, firebaseUserEmail });
      
      try {
        // 안전한 이메일 및 사용자명 생성
        const safeEmail = firebaseUserEmail || `${firebaseUserId}@auto.mingling`;
        const baseUsername = firebaseUserEmail?.split('@')[0] || 'user';
        const safeUsername = `${baseUsername}_${Date.now()}`;
        
        // upsert 패턴으로 안전하게 생성
        user = await prisma.user.upsert({
          where: { id: firebaseUserId },
          update: {
            // 이미 존재하면 업데이트하지 않음
          },
          create: {
            id: firebaseUserId,
            email: safeEmail,
            username: safeUsername,
            hearts: 150
          }
        });
        
        console.log('✅ 캐릭터 생성용 사용자 생성 완료:', user);
      } catch (createError) {
        console.error('❌ 사용자 생성 실패:', createError);
        
        // 최후의 수단: 다시 조회
        user = await prisma.user.findUnique({
          where: { id: firebaseUserId }
        });
        
        if (!user) {
          return res.status(500).json({ 
            error: '사용자 생성에 실패했습니다. 다시 로그인해주세요.',
            details: createError.message
          });
        }
      }
    } else {
      console.log('✅ 기존 사용자로 캐릭터 생성:', { userId: user.id, username: user.username });
    }
    
    const character = await prisma.character.create({
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
        isPublic: isPublic !== false,
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
      }
    });

    res.status(201).json(character);
  } catch (error) {
    console.error('Error creating character:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Failed to create character', details: error.message });
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

module.exports = router; 