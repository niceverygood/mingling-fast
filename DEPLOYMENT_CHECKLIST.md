# 🚀 Mingling 배포 체크리스트

## 📋 배포 전 체크리스트

### 🔧 인프라 확인
- [ ] EC2 인스턴스 상태 확인 (i-0dd948ee8f2c1a740)
- [ ] RDS 데이터베이스 연결 확인 (mingling-db.cdmmsa0o2tp2.ap-northeast-2.rds.amazonaws.com)
- [ ] Cloudflare DNS 설정 확인 (api.minglingchat.com → EC2 IP)
- [ ] SSL 인증서 상태 확인
- [ ] 방화벽 및 보안 그룹 설정 확인

### 🔑 환경 변수 확인
- [ ] `DATABASE_URL` 설정됨
- [ ] `OPENAI_API_KEY` 설정됨 (164자 길이 확인)
- [ ] `JWT_SECRET` 설정됨
- [ ] `ALLOWED_ORIGINS` 설정됨
- [ ] `NODE_ENV=production` 설정됨
- [ ] `PORT=8001` 설정됨

### 📦 코드 품질 확인
- [ ] 최신 main 브랜치 코드 확인
- [ ] 린트 에러 없음
- [ ] 테스트 코드 통과
- [ ] 보안 취약점 스캔 완료

## 🚀 배포 실행 단계

### 1. 코드 배포
```bash
# EC2에서 실행
cd /home/ec2-user/mingling_new
git pull origin main
cd backend
npm install --production
```

### 2. 서버 재시작
```bash
pm2 delete all
sleep 2
PORT=8001 pm2 start index.js --name "mingling-backend"
pm2 status
```

### 3. 기본 헬스 체크
```bash
curl http://localhost:8001/api/health
```

## 🧪 배포 후 테스트

### 브라우저 콘솔에서 전체 테스트 실행

1. **https://www.minglingchat.com** 접속
2. 브라우저 개발자 도구 열기 (F12)
3. Console 탭으로 이동
4. 다음 코드 복사 & 붙여넣기:

```javascript
// test-deployment.js 파일 내용 전체 복사
// 또는 GitHub Raw URL에서 직접 로드:
fetch('https://raw.githubusercontent.com/niceverygood/mingling_new/main/test-deployment.js')
  .then(response => response.text())
  .then(code => eval(code));
```

5. 전체 테스트 실행:
```javascript
minglingTester.runAllTests()
```

### 🎯 핵심 테스트 항목

#### ✅ 1. 헬스 체크 (Health Check)
```javascript
minglingTester.testHealthCheck()
```
- [ ] 서버 응답 200 OK
- [ ] 버전 정보 표시
- [ ] 타임스탬프 정상

#### ✅ 2. CORS 테스트
```javascript
minglingTester.testCORS()
```
- [ ] OPTIONS 요청 성공
- [ ] Access-Control-Allow-Origin 헤더 존재
- [ ] Access-Control-Allow-Methods 헤더 존재
- [ ] 실제 API 요청 성공

#### ✅ 3. 인증/세션 테스트
```javascript
minglingTester.testAuthentication()
```
- [ ] 사용자 자동 생성 기능 작동
- [ ] 하트 잔액 조회 성공
- [ ] 사용자 정보 조회 성공

#### ✅ 4. 데이터베이스 연결 테스트
```javascript
minglingTester.testDatabase()
```
- [ ] 캐릭터 목록 조회 성공
- [ ] 페르소나 목록 조회 성공
- [ ] DB 읽기 작업 정상

#### ✅ 5. 캐릭터 생성 API 테스트
```javascript
minglingTester.testCharacterCreation()
```
- [ ] 새 캐릭터 생성 성공
- [ ] 생성된 캐릭터 조회 성공
- [ ] 캐릭터 데이터 무결성 확인

#### ✅ 6. 채팅 기능 테스트
```javascript
minglingTester.testChatFunctionality()
```
- [ ] 채팅 목록 조회 성공
- [ ] 대화 목록 조회 성공
- [ ] 채팅 관련 API 정상

#### ✅ 7. 서버 통계 테스트
```javascript
minglingTester.testServerStats()
```
- [ ] 서버 통계 조회 성공
- [ ] 디버깅 정보 정상
- [ ] 서버 상태 모니터링 가능

## 🔍 개별 테스트 명령어

### 빠른 개별 테스트
```javascript
// 헬스 체크만
minglingTester.quickTest('health')

// CORS 테스트만
minglingTester.quickTest('cors')

// 인증 테스트만
minglingTester.quickTest('auth')

// DB 테스트만
minglingTester.quickTest('db')

// 캐릭터 생성 테스트만
minglingTester.quickTest('character')

// 채팅 기능 테스트만
minglingTester.quickTest('chat')

// 서버 통계 테스트만
minglingTester.quickTest('stats')
```

## 🚨 문제 해결 가이드

### 서버 연결 실패 시
1. EC2 인스턴스 상태 확인
2. PM2 프로세스 상태 확인: `pm2 status`
3. 로그 확인: `pm2 logs mingling-backend`
4. 포트 확인: `netstat -tlnp | grep 8001`

### CORS 에러 발생 시
1. Cloudflare Transform Rules 확인
2. 백엔드 CORS 설정 확인
3. 브라우저 네트워크 탭에서 헤더 확인

### 데이터베이스 연결 실패 시
1. RDS 인스턴스 상태 확인
2. 보안 그룹 설정 확인
3. DATABASE_URL 환경 변수 확인

### API 응답 에러 시
1. 서버 로그 확인: `pm2 logs mingling-backend`
2. 환경 변수 확인
3. 네트워크 연결 상태 확인

## 📊 성공 기준

### 🎯 최소 성공 기준
- [ ] 전체 테스트 성공률 80% 이상
- [ ] 헬스 체크 성공
- [ ] CORS 테스트 성공
- [ ] 기본 API 응답 성공

### 🏆 완벽한 배포 기준
- [ ] 전체 테스트 성공률 95% 이상
- [ ] 모든 핵심 기능 테스트 통과
- [ ] 응답 시간 1초 이내
- [ ] 에러 로그 없음

## 📈 모니터링 및 알림

### 지속적 모니터링
```javascript
// 10분마다 헬스 체크 실행
setInterval(() => {
  minglingTester.testHealthCheck();
}, 10 * 60 * 1000);
```

### 서버 통계 모니터링
```bash
# EC2에서 실행
watch -n 30 'curl -s http://localhost:8001/api/debug/stats | jq'
```

## 🔄 롤백 절차

### 문제 발생 시 롤백
1. 이전 안정 버전으로 복구:
```bash
git checkout [이전_커밋_해시]
pm2 restart all
```

2. 긴급 서버 재시작:
```bash
pm2 restart mingling-backend
```

3. 완전 재배포:
```bash
pm2 delete all
git reset --hard origin/main
PORT=8001 pm2 start index.js --name "mingling-backend"
```

---

## 📞 지원 및 문의

- 기술 문제: GitHub Issues
- 긴급 상황: 서버 로그 확인 후 롤백 실행
- 모니터링: 서버 통계 API 활용

**🎯 배포 성공을 위한 핵심: 테스트 코드 실행 후 모든 항목이 ✅ 상태인지 확인!** 