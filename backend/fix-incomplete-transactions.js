const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

console.log('🔧 미완료 거래 처리 시작');

async function processIncompleteTransactions() {
  try {
    // 1. verified 상태의 거래들 조회
    const verifiedTransactions = await prisma.heartTransaction.findMany({
      where: {
        status: 'verified'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    console.log(`📋 미완료 거래 ${verifiedTransactions.length}개 발견`);

    if (verifiedTransactions.length === 0) {
      console.log('✅ 처리할 미완료 거래가 없습니다.');
      return;
    }

    // 2. 각 거래를 처리
    for (const transaction of verifiedTransactions) {
      console.log(`\n🔄 거래 처리 중: ${transaction.id}`);
      console.log('📝 거래 정보:', {
        impUid: transaction.impUid,
        merchantUid: transaction.merchantUid,
        amount: transaction.amount,
        userId: transaction.userId,
        createdAt: transaction.createdAt
      });

      try {
        // 결제 금액에 따른 하트 수량 결정
        let heartAmount = 50; // 기본값
        
        switch (transaction.amount) {
          case 1000:
            heartAmount = 50;
            break;
          case 2000:
            heartAmount = 100;
            break;
          case 5000:
            heartAmount = 300;
            break;
          case 10000:
            heartAmount = 700;
            break;
          default:
            heartAmount = Math.floor(transaction.amount / 20); // 1원당 0.05하트
        }

        console.log(`💖 지급할 하트: ${heartAmount}`);

        // 3. 사용자 정보 조회/생성
        let user = await prisma.user.findUnique({
          where: { id: transaction.userId }
        });

        if (!user) {
          console.log('👤 사용자 자동 생성 중...');
          user = await prisma.user.create({
            data: {
              id: transaction.userId,
              email: `${transaction.userId}@auto-fix.user`,
              username: `user_${transaction.userId}`,
              hearts: heartAmount
            }
          });
          console.log('✅ 사용자 생성 완료');
        } else {
          console.log(`👤 기존 사용자 - 현재 하트: ${user.hearts}`);
        }

        // 4. 트랜잭션으로 하트 지급 및 상태 업데이트
        const result = await prisma.$transaction(async (tx) => {
          // 하트 지급
          const updatedUser = await tx.user.update({
            where: { id: transaction.userId },
            data: {
              hearts: {
                increment: heartAmount
              }
            }
          });

          // 거래 상태 업데이트
          const updatedTransaction = await tx.heartTransaction.update({
            where: { id: transaction.id },
            data: {
              status: 'completed',
              heartAmount: heartAmount,
              completedAt: new Date()
            }
          });

          return {
            user: updatedUser,
            transaction: updatedTransaction
          };
        });

        console.log('✅ 거래 처리 완료:', {
          userId: transaction.userId,
          addedHearts: heartAmount,
          newBalance: result.user.hearts,
          transactionId: transaction.id
        });

      } catch (error) {
        console.error(`❌ 거래 ${transaction.id} 처리 실패:`, error.message);
        continue;
      }
    }

    console.log('\n🎉 모든 미완료 거래 처리 완료!');
    
    // 5. 결과 확인
    const remainingVerified = await prisma.heartTransaction.count({
      where: { status: 'verified' }
    });
    
    const completedCount = await prisma.heartTransaction.count({
      where: { status: 'completed' }
    });

    console.log('📊 최종 상태:', {
      remainingVerified,
      completedCount,
      totalProcessed: verifiedTransactions.length
    });

  } catch (error) {
    console.error('❌ 미완료 거래 처리 실패:', error);
  } finally {
    await prisma.$disconnect();
  }
}

processIncompleteTransactions(); 