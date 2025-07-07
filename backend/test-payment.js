const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testPaymentCreate() {
  try {
    console.log('🧪 결제 생성 테스트 시작');
    
    const transaction = await prisma.heartTransaction.create({
      data: {
        userId: 'test-user-direct',
        impUid: 'test_imp_direct123',
        merchantUid: 'test_merchant_direct123',
        amount: 1000,
        type: 'purchase',
        status: 'verified',
        paymentMethod: 'test',
        paidAt: new Date()
      }
    });

    console.log('✅ 결제 생성 성공:', transaction);
    return transaction;
  } catch (error) {
    console.error('❌ 결제 생성 실패:', error.message);
    throw error;
  }
}

testPaymentCreate()
  .then(() => {
    console.log('✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 테스트 실패:', error);
    process.exit(1);
  }); 