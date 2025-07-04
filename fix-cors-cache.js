// 🔧 브라우저 CORS 캐시 문제 해결 스크립트
// 브라우저 콘솔에서 실행하세요

console.log('🔧 CORS 캐시 문제 해결 시작...');

// 1. 브라우저 캐시 강제 새로고침
function forceClearCache() {
  console.log('🧹 브라우저 캐시 강제 클리어...');
  
  // Service Worker 캐시 클리어
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => {
        registration.unregister();
      });
    });
  }
  
  // 로컬 스토리지 클리어
  localStorage.clear();
  sessionStorage.clear();
  
  console.log('✅ 캐시 클리어 완료');
}

// 2. CORS 테스트 함수
async function testCORS() {
  console.log('🌐 CORS 테스트 시작...');
  
  const testEndpoints = [
    '/api/health',
    '/api/characters',
    '/api/characters/recommended',
    '/api/users/me'
  ];
  
  for (const endpoint of testEndpoints) {
    try {
      console.log(`📡 테스트: ${endpoint}`);
      
      const response = await fetch(`https://api.minglingchat.com${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Email': 'test@example.com',
          'X-User-Id': 'test-user-123',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-cache'
      });
      
      console.log(`✅ ${endpoint}: ${response.status}`);
      console.log(`   CORS Origin: ${response.headers.get('Access-Control-Allow-Origin')}`);
      
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
    }
  }
}

// 3. 강제 새로고침 함수
function forceReload() {
  console.log('🔄 페이지 강제 새로고침...');
  window.location.reload(true);
}

// 4. 캐시 무시 fetch 함수
function fetchWithoutCache(url, options = {}) {
  const timestamp = Date.now();
  const separator = url.includes('?') ? '&' : '?';
  const urlWithTimestamp = `${url}${separator}_t=${timestamp}`;
  
  return fetch(urlWithTimestamp, {
    ...options,
    cache: 'no-cache',
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      ...options.headers
    }
  });
}

// 5. 자동 수정 실행
async function autoFix() {
  console.log('🚀 자동 CORS 문제 해결 시작...');
  
  // 캐시 클리어
  forceClearCache();
  
  // 잠시 대기
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // CORS 테스트
  await testCORS();
  
  console.log('');
  console.log('🎯 해결 방법:');
  console.log('1. 브라우저 완전 종료 후 재시작');
  console.log('2. 시크릿/프라이빗 모드에서 테스트');
  console.log('3. 개발자 도구 > Network 탭에서 "Disable cache" 체크');
  console.log('4. 아래 함수들 사용:');
  console.log('   - forceClearCache() : 캐시 강제 클리어');
  console.log('   - testCORS() : CORS 상태 테스트');
  console.log('   - forceReload() : 강제 새로고침');
  console.log('   - fetchWithoutCache(url) : 캐시 무시 요청');
}

// 전역 함수로 등록
window.forceClearCache = forceClearCache;
window.testCORS = testCORS;
window.forceReload = forceReload;
window.fetchWithoutCache = fetchWithoutCache;
window.autoFix = autoFix;

// 자동 실행
autoFix();

console.log('');
console.log('💡 사용법:');
console.log('- autoFix() : 전체 자동 수정');
console.log('- testCORS() : CORS 테스트만');
console.log('- forceClearCache() : 캐시만 클리어');
console.log('- forceReload() : 강제 새로고침'); 