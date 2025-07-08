#!/usr/bin/env node

/**
 * 데이터베이스 문제 해결 스크립트
 * - 중복 사용자 정리
 * - 결제 시스템 무결성 복구
 * - 테스트 데이터 정리
 */

const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function fixDatabaseIssues() {
  console.log('🔧 데이터베이스 문제 해결 시작...');
  
  try {
    // 1단계: 중복 이메일 사용자 조회
    console.log('🔍 중복 이메일 사용자 조회 중...');
    
    const duplicateEmails = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count 
      FROM users 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `;
    
    console.log('📊 중복 이메일 발견:', duplicateEmails.length);
    
    // 2단계: 중복 이메일 정리
    if (duplicateEmails.length > 0) {
      for (const duplicate of duplicateEmails) {
        const email = duplicate.email;
        console.log(`\n🔧 이메일 "${email}" 중복 정리 중...`);
        
        const users = await prisma.user.findMany({
          where: { email: email },
          orderBy: { createdAt: 'asc' }
        });
        
        // 가장 오래된 사용자 유지, 나머지는 이메일 변경
        const keepUser = users[0];
        const duplicateUsers = users.slice(1);
        
        for (let i = 0; i < duplicateUsers.length; i++) {
          const user = duplicateUsers[i];
          const newEmail = `${user.id}@duplicate-${Date.now()}.mingling`;
          
          await prisma.user.update({
            where: { id: user.id },
            data: { email: newEmail }
          });
          
          console.log(`🔄 사용자 ${user.id} 이메일 변경 완료`);
        }
      }
    }
    
    // 3단계: 테스트 사용자 정리
    console.log('\n🧪 테스트 사용자 정리 중...');
    
    const testUsers = await prisma.user.findMany({
      where: {
        OR: [
          { email: { contains: 'test@example.com' } },
          { email: { contains: 'emergency@example.com' } },
          { id: { contains: 'test_' } }
        ]
      }
    });
    
    console.log(`📋 테스트 사용자 발견: ${testUsers.length}개`);
    
    // 거래 내역이 없는 테스트 사용자만 삭제
    for (const user of testUsers) {
      const transactionCount = await prisma.heartTransaction.count({
        where: { userId: user.id }
      });
      
      if (transactionCount === 0) {
        await prisma.user.delete({
          where: { id: user.id }
        });
        console.log(`🗑️ 테스트 사용자 ${user.id} 삭제`);
      } else {
        console.log(`✅ 테스트 사용자 ${user.id} 유지 (거래 ${transactionCount}건)`);
      }
    }
    
    // 4단계: 무결성 검증
    console.log('\n🔍 데이터베이스 무결성 검증...');
    
    const finalDuplicates = await prisma.$queryRaw`
      SELECT email, COUNT(*) as count 
      FROM users 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `;
    
    const totalUsers = await prisma.user.count();
    const totalTransactions = await prisma.heartTransaction.count();
    
    console.log('\n📊 정리 결과:');
    console.log(`   - 중복 이메일 해결: ${finalDuplicates.length === 0 ? '✅ 완료' : '❌ 실패'}`);
    console.log(`   - 총 사용자: ${totalUsers}명`);
    console.log(`   - 총 거래: ${totalTransactions}건`);
    
    if (finalDuplicates.length === 0) {
      console.log('\n✅ 데이터베이스 문제 해결 완료!');
    } else {
      console.log('\n❌ 일부 문제가 남아있습니다:', finalDuplicates);
    }
    
  } catch (error) {
    console.error('❌ 데이터베이스 문제 해결 실패:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// 스크립트 실행
if (require.main === module) {
  fixDatabaseIssues()
    .then(() => {
      console.log('🎉 스크립트 실행 완료');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 스크립트 실행 실패:', error);
      process.exit(1);
    });
}

module.exports = { fixDatabaseIssues }; 