// 🚀 Mingling 원클릭 배포 테스트
// 브라우저 콘솔에서 실행: copy & paste this code

(async function quickDeploymentTest() {
  console.log('🚀 Mingling 원클릭 배포 테스트 시작...\n');
  
  const API_URL = 'https://api.minglingchat.com';
  const testResults = [];
  
  // 테스트 결과 로깅 함수
  function logResult(test, success, details = '') {
    const emoji = success ? '✅' : '❌';
    const result = `${emoji} ${test}`;
    console.log(result, details);
    testResults.push({ test, success, details });
    return success;
  }
  
  // API 요청 함수
  async function testAPI(endpoint, method = 'GET', body = null) {
    try {
      const options = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': `quick-test-${Date.now()}@test.com`,
          'X-User-Id': `test-${Date.now()}`
        }
      };
      
      if (body) {
        options.body = JSON.stringify(body);
      }
      
      const response = await fetch(`${API_URL}${endpoint}`, options);
      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        data: data
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  console.log('🏥 1. 헬스 체크...');
  const health = await testAPI('/api/health');
  logResult('서버 헬스 체크', health.success, 
    health.success ? `버전: ${health.data.version}` : health.error);
  
  console.log('\n🌐 2. CORS 테스트...');
  const cors = await testAPI('/api/debug/stats');
  logResult('CORS 설정', cors.success, 
    cors.success ? '헤더 정상' : cors.error);
  
  console.log('\n🔐 3. 인증 테스트...');
  const auth = await testAPI('/api/users/me');
  logResult('사용자 인증', auth.success, 
    auth.success ? '자동 생성 성공' : auth.error);
  
  console.log('\n🗄️ 4. 데이터베이스 테스트...');
  const db = await testAPI('/api/characters');
  logResult('DB 연결', db.success, 
    db.success ? `캐릭터 ${db.data.length}개` : db.error);
  
  console.log('\n🤖 5. 캐릭터 생성 테스트...');
  const character = await testAPI('/api/characters', 'POST', {
    name: `Quick Test ${Date.now()}`,
    description: 'Quick deployment test character',
    personality: 'test-friendly',
    category: 'friend'
  });
  logResult('캐릭터 생성', character.success, 
    character.success ? `ID: ${character.data.id}` : character.error);
  
  // 결과 요약
  const passed = testResults.filter(r => r.success).length;
  const total = testResults.length;
  const successRate = ((passed / total) * 100).toFixed(1);
  
  console.log('\n📊 === 테스트 결과 요약 ===');
  console.log(`✅ 성공: ${passed}/${total} (${successRate}%)`);
  
  if (successRate >= 80) {
    console.log('🎉 배포 성공! 서비스 정상 작동 중');
  } else {
    console.log('⚠️  일부 기능에 문제가 있습니다. 상세 로그를 확인하세요.');
  }
  
  console.log('\n🔍 상세 테스트가 필요한 경우:');
  console.log('fetch("https://raw.githubusercontent.com/niceverygood/mingling_new/main/test-deployment.js").then(r=>r.text()).then(eval)');
  
  return testResults;
})(); 