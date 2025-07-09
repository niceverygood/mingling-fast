/**
 * 데이터베이스 유틸리티 함수들
 */

const { PrismaClient } = require('@prisma/client');

// Prisma 클라이언트 싱글톤
let prisma;

/**
 * Prisma 클라이언트 초기화
 */
const initializePrisma = () => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error'] : ['error'],
      errorFormat: 'pretty'
    });
  }
  return prisma;
};

/**
 * 데이터베이스 연결 상태 확인
 */
const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    console.log('✅ Database connection established');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
};

/**
 * 사용자 존재 확인 및 자동 생성
 */
const ensureUserExists = async (firebaseUserId, email = null) => {
  try {
    let user = await prisma.user.findUnique({
      where: { id: firebaseUserId }
    });

    if (!user) {
      console.log(`👤 Creating new user: ${firebaseUserId}`);
      user = await prisma.user.create({
        data: {
          id: firebaseUserId,
          email: email || `${firebaseUserId}@temp.com`,
          hearts: 100 // 신규 사용자 기본 하트
        }
      });
    }

    return user;
  } catch (error) {
    console.error('❌ Error ensuring user exists:', error);
    throw error;
  }
};

/**
 * 하트 잔액 조회
 */
const getHeartBalance = async (userId) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { hearts: true }
    });

    return user ? user.hearts : 0;
  } catch (error) {
    console.error('❌ Error getting heart balance:', error);
    throw error;
  }
};

/**
 * 하트 잔액 업데이트 (트랜잭션)
 */
const updateHeartBalance = async (userId, amount, description = null) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      // 현재 잔액 확인
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { hearts: true }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      const newBalance = user.hearts + amount;

      if (newBalance < 0) {
        throw new Error('INSUFFICIENT_HEARTS');
      }

      // 잔액 업데이트
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: { hearts: newBalance }
      });

      // 거래 내역 저장 (옵션)
      if (description) {
        await tx.heartTransaction.create({
          data: {
            userId,
            amount,
            description,
            balanceAfter: newBalance
          }
        });
      }

      return updatedUser;
    });

    return result;
  } catch (error) {
    console.error('❌ Error updating heart balance:', error);
    throw error;
  }
};

/**
 * 페이지네이션 헬퍼
 */
const getPaginationParams = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
  
  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
    page: pageNum,
    limit: limitNum
  };
};

/**
 * 페이지네이션 메타데이터 생성
 */
const createPaginationMeta = (totalCount, page, limit) => {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    totalCount,
    totalPages,
    currentPage: page,
    hasNext: page < totalPages,
    hasPrev: page > 1,
    limit
  };
};

/**
 * 데이터베이스 트랜잭션 헬퍼
 */
const withTransaction = async (callback) => {
  return await prisma.$transaction(callback);
};

/**
 * 데이터베이스 연결 종료
 */
const disconnectDatabase = async () => {
  if (prisma) {
    await prisma.$disconnect();
    console.log('🔌 Database connection closed');
  }
};

/**
 * 데이터베이스 초기화 (시드 데이터)
 */
const seedDatabase = async () => {
  try {
    console.log('🌱 Seeding database...');
    
    // 테스트 사용자 생성 (개발 환경에서만)
    if (process.env.NODE_ENV === 'development') {
      const testUser = await prisma.user.upsert({
        where: { id: 'test-user-123' },
        update: {},
        create: {
          id: 'test-user-123',
          email: 'test@example.com',
          hearts: 1000
        }
      });
      
      console.log('👤 Test user created:', testUser.id);
    }
    
    console.log('✅ Database seeding completed');
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    throw error;
  }
};

/**
 * 데이터베이스 통계 조회
 */
const getDatabaseStats = async () => {
  try {
    const [
      userCount,
      characterCount,
      chatCount,
      messageCount,
      personaCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.character.count(),
      prisma.chat.count(),
      prisma.message.count(),
      prisma.persona.count()
    ]);

    return {
      users: userCount,
      characters: characterCount,
      chats: chatCount,
      messages: messageCount,
      personas: personaCount,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('❌ Error getting database stats:', error);
    throw error;
  }
};

module.exports = {
  initializePrisma,
  checkDatabaseConnection,
  ensureUserExists,
  getHeartBalance,
  updateHeartBalance,
  getPaginationParams,
  createPaginationMeta,
  withTransaction,
  disconnectDatabase,
  seedDatabase,
  getDatabaseStats
}; 