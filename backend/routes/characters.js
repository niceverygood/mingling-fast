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