// 🔥 Cloudflare 캐시 문제 해결 확인 테스트
const https = require('https');
const http = require('http');

const API_BASE = 'https://api.minglingchat.com';

// 강력한 캐시 바이패스 헤더
const CACHE_BYPASS_HEADERS = {
  'Cache-Control': 'no-cache, no-store, must-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
  'If-Modified-Since': 'Mon, 26 Jul 1997 05:00:00 GMT',
  'If-None-Match': '"no-match"',
  'X-Requested-With': 'XMLHttpRequest',
  'X-Timestamp': Date.now().toString(),
  'User-Agent': 'Mozilla/5.0 (compatible; TestBot/1.0)',
  'Accept': 'application/json, text/plain, */*'
};

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: {
        ...CACHE_BYPASS_HEADERS,
        ...options.headers
      }
    };

    const protocol = urlObj.protocol === 'https:' ? https : http;
    const req = protocol.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Cloudflare 캐시 문제 해결 확인 테스트 시작...\n');
  
  const tests = [
    {
      name: '헬스체크 (버전 확인)',
      url: `${API_BASE}/api/health`,
      expected: 'version.*1\\.1\\.0'
    },
    {
      name: '결제 검증 API',
      url: `${API_BASE}/api/payment/verify`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
      expected: 'success.*false'
    },
    {
      name: '사용자 목록 API',
      url: `${API_BASE}/api/users`,
      expected: 'users|\\[\\]'
    },
    {
      name: '캐릭터 목록 API', 
      url: `${API_BASE}/api/characters`,
      expected: 'characters|\\[\\]'
    },
    {
      name: '환경 정보 API (새 엔드포인트)',
      url: `${API_BASE}/api/environment`,
      expected: 'environment|version'
    }
  ];

  let passedTests = 0;
  let failedTests = 0;

  for (const test of tests) {
    try {
      console.log(`📋 테스트: ${test.name}`);
      
      const response = await makeRequest(test.url, {
        method: test.method,
        headers: test.headers,
        body: test.body
      });
      
      console.log(`   상태: ${response.statusCode}`);
      console.log(`   캐시 헤더: ${response.headers['cf-cache-status'] || 'N/A'}`);
      console.log(`   타임스탬프: ${response.headers['x-timestamp'] || 'N/A'}`);
      
      if (response.statusCode === 200) {
        if (test.expected && !new RegExp(test.expected, 'i').test(response.body)) {
          console.log(`   ❌ 실패: 예상 응답 패턴 불일치`);
          console.log(`   응답: ${response.body.substring(0, 100)}...`);
          failedTests++;
        } else {
          console.log(`   ✅ 성공`);
          passedTests++;
        }
      } else {
        console.log(`   ❌ 실패: HTTP ${response.statusCode}`);
        console.log(`   응답: ${response.body.substring(0, 100)}...`);
        failedTests++;
      }
      
    } catch (error) {
      console.log(`   ❌ 오류: ${error.message}`);
      failedTests++;
    }
    
    console.log('');
  }

  console.log('📊 테스트 결과:');
  console.log(`   ✅ 성공: ${passedTests}`);
  console.log(`   ❌ 실패: ${failedTests}`);
  console.log(`   📈 성공률: ${Math.round((passedTests / (passedTests + failedTests)) * 100)}%`);

  if (failedTests > 0) {
    console.log('\n🔧 문제가 지속되면 Cloudflare 캐시 퍼지가 필요할 수 있습니다.');
    console.log('   방법 1: Cloudflare 대시보드 > 캐시 > 퍼지 > 모든 것 퍼지');
    console.log('   방법 2: API 규칙에서 /api/* 경로 캐시 비활성화');
  } else {
    console.log('\n🎉 모든 테스트 통과! 캐시 문제가 해결되었습니다.');
  }
}

runTests().catch(console.error); 