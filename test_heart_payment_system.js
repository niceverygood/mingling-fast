// 🔧 하트 결제 시스템 근본 해결 테스트
const axios = require('axios');

const API_BASE = 'https://api.minglingchat.com';
const TEST_USER_ID = 'test_user_' + Date.now();
const TEST_USER_EMAIL = 'test@example.com';

// 테스트 헤더
const getTestHeaders = () => ({
  'Content-Type': 'application/json',
  'X-User-ID': TEST_USER_ID,
  'X-User-Email': TEST_USER_EMAIL
});

// 색상 출력 함수
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

const log = (color, message) => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

async function testHeartPaymentSystem() {
  log('blue', '🔧 하트 결제 시스템 근본 해결 테스트 시작');
  console.log('====================================');
  
  let testsPassed = 0;
  let testsTotal = 0;
  
  // 테스트 1: 사용자 자동 생성 테스트
  try {
    testsTotal++;
    log('yellow', '📝 테스트 1: 사용자 자동 생성 테스트');
    
    const response = await axios.post(`${API_BASE}/api/hearts/purchase`, {
      imp_uid: 'test_imp_' + Date.now(),
      merchant_uid: 'test_merchant_' + Date.now(),
      package_id: 'basic',
      heart_amount: 50,
      paid_amount: 1000
    }, { headers: getTestHeaders() });
    
    if (response.data.success) {
      log('green', '✅ 사용자 자동 생성 성공');
      testsPassed++;
    } else {
      log('red', '❌ 사용자 자동 생성 실패: ' + response.data.error);
    }
  } catch (error) {
    log('red', '❌ 사용자 자동 생성 테스트 실패: ' + error.message);
  }
  
  // 테스트 2: 하트 잔액 실시간 조회 테스트
  try {
    testsTotal++;
    log('yellow', '📝 테스트 2: 하트 잔액 실시간 조회 테스트');
    
    const response = await axios.get(`${API_BASE}/api/hearts/balance`, {
      headers: getTestHeaders()
    });
    
    if (response.data.hearts !== undefined) {
      log('green', `✅ 하트 잔액 조회 성공: ${response.data.hearts}개`);
      testsPassed++;
    } else {
      log('red', '❌ 하트 잔액 조회 실패');
    }
  } catch (error) {
    log('red', '❌ 하트 잔액 조회 테스트 실패: ' + error.message);
  }
  
  // 테스트 3: 트랜잭션 원자성 테스트
  try {
    testsTotal++;
    log('yellow', '📝 테스트 3: 트랜잭션 원자성 테스트');
    
    // 먼저 현재 잔액 조회
    const balanceBefore = await axios.get(`${API_BASE}/api/hearts/balance`, {
      headers: getTestHeaders()
    });
    
    // 하트 구매
    const purchaseResponse = await axios.post(`${API_BASE}/api/hearts/purchase`, {
      imp_uid: 'test_imp_' + Date.now(),
      merchant_uid: 'test_merchant_' + Date.now(),
      package_id: 'popular',
      heart_amount: 120,
      paid_amount: 2000
    }, { headers: getTestHeaders() });
    
    if (purchaseResponse.data.success) {
      // 구매 후 잔액 조회
      const balanceAfter = await axios.get(`${API_BASE}/api/hearts/balance`, {
        headers: getTestHeaders()
      });
      
      const expectedBalance = balanceBefore.data.hearts + 120;
      const actualBalance = balanceAfter.data.hearts;
      
      if (actualBalance === expectedBalance) {
        log('green', `✅ 트랜잭션 원자성 테스트 성공: ${balanceBefore.data.hearts} → ${actualBalance} (차이: +120)`);
        testsPassed++;
      } else {
        log('red', `❌ 트랜잭션 원자성 테스트 실패: 예상 ${expectedBalance}, 실제 ${actualBalance}`);
      }
    } else {
      log('red', '❌ 하트 구매 실패: ' + purchaseResponse.data.error);
    }
  } catch (error) {
    log('red', '❌ 트랜잭션 원자성 테스트 실패: ' + error.message);
  }
  
  // 테스트 4: 여러 패키지 구매 테스트
  try {
    testsTotal++;
    log('yellow', '📝 테스트 4: 여러 패키지 구매 테스트');
    
    const packages = [
      { id: 'basic', hearts: 50, price: 1000 },
      { id: 'value', hearts: 300, price: 4500 },
      { id: 'premium', hearts: 500, price: 7000 }
    ];
    
    let allPackagesWork = true;
    
    for (const pkg of packages) {
      try {
        const response = await axios.post(`${API_BASE}/api/hearts/purchase`, {
          imp_uid: 'test_imp_' + Date.now(),
          merchant_uid: 'test_merchant_' + Date.now(),
          package_id: pkg.id,
          heart_amount: pkg.hearts,
          paid_amount: pkg.price
        }, { headers: getTestHeaders() });
        
        if (!response.data.success) {
          allPackagesWork = false;
          log('red', `❌ ${pkg.id} 패키지 구매 실패: ${response.data.error}`);
        }
      } catch (error) {
        allPackagesWork = false;
        log('red', `❌ ${pkg.id} 패키지 테스트 실패: ${error.message}`);
      }
    }
    
    if (allPackagesWork) {
      log('green', '✅ 모든 패키지 구매 테스트 성공');
      testsPassed++;
    }
  } catch (error) {
    log('red', '❌ 패키지 구매 테스트 실패: ' + error.message);
  }
  
  // 테스트 5: 잘못된 파라미터 처리 테스트
  try {
    testsTotal++;
    log('yellow', '📝 테스트 5: 잘못된 파라미터 처리 테스트');
    
    const response = await axios.post(`${API_BASE}/api/hearts/purchase`, {
      imp_uid: 'test_imp_' + Date.now(),
      merchant_uid: 'test_merchant_' + Date.now(),
      package_id: 'invalid_package',
      heart_amount: 999,
      paid_amount: 999
    }, { headers: getTestHeaders() });
    
    if (!response.data.success) {
      log('green', '✅ 잘못된 파라미터 처리 성공: ' + response.data.error);
      testsPassed++;
    } else {
      log('red', '❌ 잘못된 파라미터 처리 실패: 에러가 발생해야 함');
    }
  } catch (error) {
    if (error.response?.data?.error) {
      log('green', '✅ 잘못된 파라미터 처리 성공: ' + error.response.data.error);
      testsPassed++;
    } else {
      log('red', '❌ 잘못된 파라미터 처리 실패: ' + error.message);
    }
  }
  
  console.log('====================================');
  if (testsPassed === testsTotal) {
    log('green', `🎉 모든 테스트 통과! (${testsPassed}/${testsTotal})`);
    log('green', '✅ 하트 결제 시스템 근본 해결 완료!');
  } else {
    log('red', `❌ 일부 테스트 실패 (${testsPassed}/${testsTotal})`);
  }
}

// 실행
testHeartPaymentSystem().catch(console.error); 