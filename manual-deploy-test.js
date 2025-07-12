#!/usr/bin/env node

/**
 * 수동 배포 테스트 스크립트
 * 현재 채팅 문제를 즉시 해결하기 위한 임시 솔루션
 */

const https = require('https');

const DEPLOYMENT_SECRET = 'mingling-deploy-secret-2025';
const API_URL = 'https://api.minglingchat.com';

/**
 * API 호출 함수
 */
const callAPI = (path, method = 'GET', data = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'ManualDeployScript/1.0'
      }
    };

    if (data) {
      const jsonData = JSON.stringify(data);
      options.headers['Content-Length'] = Buffer.byteLength(jsonData);
    }

    const req = https.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            data: parsed
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            data: responseData
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
};

/**
 * 메인 실행 함수
 */
const main = async () => {
  console.log('🚀 수동 배포 테스트 시작...');
  console.log(`📡 대상 서버: ${API_URL}`);
  console.log(`⏰ 시작 시간: ${new Date().toISOString()}`);
  console.log();

  try {
    // 1. 현재 서버 상태 확인
    console.log('1️⃣ 현재 서버 상태 확인...');
    try {
      const healthResponse = await callAPI('/api/health');
      console.log(`✅ 서버 응답: ${healthResponse.statusCode}`);
      console.log(`📊 업타임: ${healthResponse.data.uptime}초`);
    } catch (error) {
      console.log(`❌ 서버 상태 확인 실패: ${error.message}`);
    }
    console.log();

    // 2. 배포 상태 확인 (새로운 엔드포인트가 있는지 확인)
    console.log('2️⃣ 배포 시스템 상태 확인...');
    try {
      const statusResponse = await callAPI('/api/deploy/status');
      console.log(`✅ 배포 시스템 응답: ${statusResponse.statusCode}`);
      if (statusResponse.data.success) {
        console.log(`📊 서버 상태: ${statusResponse.data.status}`);
        console.log(`📈 프로세스 수: ${statusResponse.data.processes?.length || 0}`);
      }
    } catch (error) {
      console.log(`❌ 배포 시스템 확인 실패: ${error.message}`);
    }
    console.log();

    // 3. Hearts API 테스트 (현재 문제 재현)
    console.log('3️⃣ Hearts API 문제 재현 테스트...');
    try {
      const heartsResponse = await callAPI('/api/hearts/spend', 'POST', {
        amount: 1,
        description: 'deployment test'
      });
      console.log(`📊 Hearts API 응답: ${heartsResponse.statusCode}`);
      if (heartsResponse.statusCode === 404) {
        console.log('❌ Hearts API 404 에러 확인됨 - 배포 필요!');
      } else {
        console.log('✅ Hearts API 정상 작동');
      }
    } catch (error) {
      console.log(`❌ Hearts API 테스트 실패: ${error.message}`);
    }
    console.log();

    // 4. 수동 배포 실행 (새로운 엔드포인트가 있는 경우)
    console.log('4️⃣ 수동 배포 실행 시도...');
    try {
      const deployResponse = await callAPI('/api/deploy/deploy', 'POST', {
        secret: DEPLOYMENT_SECRET
      });
      
      console.log(`📊 배포 API 응답: ${deployResponse.statusCode}`);
      
      if (deployResponse.data.success) {
        console.log('🎉 배포 성공!');
        console.log('📋 배포 로그:');
        deployResponse.data.log?.forEach(log => console.log(`   ${log}`));
      } else {
        console.log('❌ 배포 실패:');
        console.log(`   ${deployResponse.data.error}`);
      }
    } catch (error) {
      console.log(`❌ 수동 배포 실패: ${error.message}`);
      console.log('💡 새로운 배포 시스템이 아직 활성화되지 않음');
    }
    console.log();

    // 5. 배포 후 Hearts API 재테스트
    console.log('5️⃣ 배포 후 Hearts API 재테스트...');
    // 잠시 대기
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    try {
      const retestResponse = await callAPI('/api/hearts/spend', 'POST', {
        amount: 1,
        description: 'post-deployment test'
      });
      
      console.log(`📊 재테스트 응답: ${retestResponse.statusCode}`);
      
      if (retestResponse.statusCode === 200) {
        console.log('🎉 Hearts API 복구 성공!');
      } else if (retestResponse.statusCode === 404) {
        console.log('❌ Hearts API 여전히 404 에러');
        console.log('💡 수동 EC2 재시작이 필요할 수 있습니다');
      } else {
        console.log(`⚠️ 예상과 다른 응답: ${retestResponse.statusCode}`);
        console.log(`📋 응답 내용: ${JSON.stringify(retestResponse.data, null, 2)}`);
      }
    } catch (error) {
      console.log(`❌ 재테스트 실패: ${error.message}`);
    }

  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error);
  }

  console.log();
  console.log('🏁 수동 배포 테스트 완료');
  console.log(`⏰ 종료 시간: ${new Date().toISOString()}`);
};

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { callAPI, main }; 