// 🧪 Mingling 배포 환경 테스트 스위트
// 브라우저 콘솔에서 실행: copy & paste this entire code

class DeploymentTester {
  constructor() {
    this.apiUrl = 'https://api.minglingchat.com';
    this.testResults = [];
    this.testUser = {
      email: `test-${Date.now()}@minglingchat.com`,
      id: `test-user-${Date.now()}`,
      name: 'Test User'
    };
    
    console.log('🧪 Mingling Deployment Tester Initialized');
    console.log('📍 API URL:', this.apiUrl);
    console.log('👤 Test User:', this.testUser);
  }

  // 🔧 유틸리티 함수들
  async makeRequest(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const defaultOptions = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': this.testUser.email,
        'X-User-Id': this.testUser.id
      }
    };

    const finalOptions = { ...defaultOptions, ...options };
    if (finalOptions.body && typeof finalOptions.body === 'object') {
      finalOptions.body = JSON.stringify(finalOptions.body);
    }

    console.log(`📡 ${finalOptions.method} ${url}`);
    
    try {
      const response = await fetch(url, finalOptions);
      const data = await response.json();
      
      return {
        success: response.ok,
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 0
      };
    }
  }

  logTest(testName, success, details = {}) {
    const emoji = success ? '✅' : '❌';
    const result = { testName, success, details, timestamp: new Date().toISOString() };
    this.testResults.push(result);
    
    console.log(`${emoji} ${testName}`, details);
    return result;
  }

  // 🏥 1. 헬스 체크 및 기본 연결 테스트
  async testHealthCheck() {
    console.log('\n🏥 === HEALTH CHECK TESTS ===');
    
    const result = await this.makeRequest('/api/health');
    
    if (result.success) {
      this.logTest('Health Check', true, {
        status: result.status,
        version: result.data.version,
        timestamp: result.data.timestamp
      });
    } else {
      this.logTest('Health Check', false, {
        error: result.error,
        status: result.status
      });
    }
    
    return result;
  }

  // 🌐 2. CORS 테스트
  async testCORS() {
    console.log('\n🌐 === CORS TESTS ===');
    
    // OPTIONS 요청 테스트
    const optionsResult = await this.makeRequest('/api/health', {
      method: 'OPTIONS'
    });
    
    this.logTest('CORS OPTIONS Request', optionsResult.success, {
      status: optionsResult.status,
      corsHeaders: {
        'access-control-allow-origin': optionsResult.headers['access-control-allow-origin'],
        'access-control-allow-methods': optionsResult.headers['access-control-allow-methods'],
        'access-control-allow-headers': optionsResult.headers['access-control-allow-headers']
      }
    });

    // 실제 CORS 요청 테스트
    const corsResult = await this.makeRequest('/api/debug/stats');
    
    this.logTest('CORS Actual Request', corsResult.success, {
      status: corsResult.status,
      hasOriginHeader: !!corsResult.headers['access-control-allow-origin']
    });

    return { optionsResult, corsResult };
  }

  // 🔐 3. 인증/세션 테스트
  async testAuthentication() {
    console.log('\n🔐 === AUTHENTICATION TESTS ===');
    
    // 사용자 자동 생성 테스트
    const userResult = await this.makeRequest('/api/users/me');
    
    this.logTest('User Auto Creation', userResult.success, {
      status: userResult.status,
      userData: userResult.data
    });

    // 하트 정보 조회 테스트
    const heartsResult = await this.makeRequest('/api/hearts/balance');
    
    this.logTest('Hearts Balance Check', heartsResult.success, {
      status: heartsResult.status,
      hearts: heartsResult.data?.hearts
    });

    return { userResult, heartsResult };
  }

  // 🗄️ 4. 데이터베이스 연결 테스트
  async testDatabase() {
    console.log('\n🗄️ === DATABASE TESTS ===');
    
    // 캐릭터 목록 조회 (DB 읽기 테스트)
    const charactersResult = await this.makeRequest('/api/characters');
    
    this.logTest('Database Read (Characters)', charactersResult.success, {
      status: charactersResult.status,
      characterCount: charactersResult.data?.length || 0
    });

    // 페르소나 목록 조회 (DB 읽기 테스트)
    const personasResult = await this.makeRequest('/api/personas');
    
    this.logTest('Database Read (Personas)', personasResult.success, {
      status: personasResult.status,
      personaCount: personasResult.data?.length || 0
    });

    return { charactersResult, personasResult };
  }

  // 🤖 5. 캐릭터 생성 API 테스트
  async testCharacterCreation() {
    console.log('\n🤖 === CHARACTER CREATION TESTS ===');
    
    const testCharacter = {
      name: `Test Character ${Date.now()}`,
      description: 'This is a test character created by automated testing',
      personality: 'friendly, helpful, test-oriented',
      category: 'friend',
      hashtags: ['test', 'automation', 'deployment'],
      appearance: {
        gender: 'other',
        age: 25,
        height: '170cm',
        style: 'casual'
      }
    };

    const createResult = await this.makeRequest('/api/characters', {
      method: 'POST',
      body: testCharacter
    });

    this.logTest('Character Creation', createResult.success, {
      status: createResult.status,
      characterId: createResult.data?.id,
      characterName: createResult.data?.name
    });

    // 생성된 캐릭터 조회 테스트
    if (createResult.success && createResult.data?.id) {
      const getResult = await this.makeRequest(`/api/characters/${createResult.data.id}`);
      
      this.logTest('Character Retrieval', getResult.success, {
        status: getResult.status,
        characterFound: !!getResult.data?.id
      });

      return { createResult, getResult };
    }

    return { createResult };
  }

  // 💬 6. 채팅 기능 테스트
  async testChatFunctionality() {
    console.log('\n💬 === CHAT FUNCTIONALITY TESTS ===');
    
    // 채팅 목록 조회
    const chatsResult = await this.makeRequest('/api/chats');
    
    this.logTest('Chat List Retrieval', chatsResult.success, {
      status: chatsResult.status,
      chatCount: chatsResult.data?.length || 0
    });

    // 대화 목록 조회
    const conversationsResult = await this.makeRequest('/api/conversations');
    
    this.logTest('Conversations List', conversationsResult.success, {
      status: conversationsResult.status,
      conversationCount: conversationsResult.data?.length || 0
    });

    return { chatsResult, conversationsResult };
  }

  // 📊 7. 서버 통계 및 디버깅 정보 테스트
  async testServerStats() {
    console.log('\n📊 === SERVER STATS TESTS ===');
    
    const statsResult = await this.makeRequest('/api/debug/stats');
    
    this.logTest('Server Statistics', statsResult.success, {
      status: statsResult.status,
      stats: statsResult.data
    });

    return statsResult;
  }

  // 🧪 모든 테스트 실행
  async runAllTests() {
    console.log('🚀 Starting Full Deployment Test Suite...\n');
    
    const startTime = Date.now();
    
    try {
      // 순차적으로 모든 테스트 실행
      await this.testHealthCheck();
      await this.testCORS();
      await this.testAuthentication();
      await this.testDatabase();
      await this.testCharacterCreation();
      await this.testChatFunctionality();
      await this.testServerStats();
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 결과 요약
      this.printSummary(duration);
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.logTest('Test Suite Execution', false, { error: error.message });
    }
  }

  // 📋 결과 요약 출력
  printSummary(duration) {
    console.log('\n📋 === TEST SUMMARY ===');
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.success).length;
    const failedTests = totalTests - passedTests;
    const successRate = ((passedTests / totalTests) * 100).toFixed(1);
    
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Total Tests: ${totalTests}`);
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📈 Success Rate: ${successRate}%`);
    
    if (failedTests > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => !r.success)
        .forEach(r => {
          console.log(`  - ${r.testName}:`, r.details);
        });
    }
    
    console.log('\n🎯 Full Test Results:');
    console.table(this.testResults.map(r => ({
      Test: r.testName,
      Status: r.success ? '✅ PASS' : '❌ FAIL',
      Details: JSON.stringify(r.details).substring(0, 100) + '...'
    })));
  }

  // 🔧 개별 테스트 실행 헬퍼
  async quickTest(testName) {
    const tests = {
      'health': () => this.testHealthCheck(),
      'cors': () => this.testCORS(),
      'auth': () => this.testAuthentication(),
      'db': () => this.testDatabase(),
      'character': () => this.testCharacterCreation(),
      'chat': () => this.testChatFunctionality(),
      'stats': () => this.testServerStats()
    };

    if (tests[testName]) {
      await tests[testName]();
    } else {
      console.log('❌ Unknown test:', testName);
      console.log('Available tests:', Object.keys(tests));
    }
  }
}

// 🚀 전역 테스터 인스턴스 생성
window.minglingTester = new DeploymentTester();

// 🎯 사용법 안내
console.log(`
🧪 Mingling Deployment Tester Ready!

📖 사용법:
• 전체 테스트 실행: minglingTester.runAllTests()
• 개별 테스트 실행: minglingTester.quickTest('health')
• 헬스 체크만: minglingTester.testHealthCheck()
• CORS 테스트만: minglingTester.testCORS()
• 인증 테스트만: minglingTester.testAuthentication()
• DB 테스트만: minglingTester.testDatabase()
• 캐릭터 생성 테스트: minglingTester.testCharacterCreation()
• 채팅 기능 테스트: minglingTester.testChatFunctionality()
• 서버 통계 테스트: minglingTester.testServerStats()

🎯 빠른 시작: minglingTester.runAllTests()
`);

// 자동으로 헬스 체크 실행
minglingTester.testHealthCheck(); 