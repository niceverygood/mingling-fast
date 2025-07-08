# 🚨 긴급 서버 업데이트 필요

## 📊 현재 상황
- **서버 가동 시간**: 4일째 연속 실행 중
- **문제점**: 최신 코드 미적용으로 결제 시스템 및 신규 기능 불작동
- **테스트 일시**: 2025-07-08 12:37 KST

## ❌ 불작동 기능들
1. **결제 시스템** - 모든 `/api/payment/*` 엔드포인트 404 에러
2. **대화 생성** - OpenAI 응답 생성 실패
3. **환경 정보 API** - `/api/environment`, `/api/deploy/validate` 404 에러

## ✅ 정상 작동 기능들
- 사용자 관리 (자동 생성, 프로필 조회)
- 캐릭터 시스템 (생성, 조회, 관리)
- 페르소나 시스템 (생성, 조회, 관리)
- 채팅 생성 (새 채팅방 생성)
- 기본 인프라 (클라우드플레어, 데이터베이스)

## 🔧 해결 방법

### 방법 1: EC2 SSH 접속 후 수동 업데이트

```bash
# 1. EC2 접속
ssh -i mingling_new.pem ec2-user@[EC2_PUBLIC_IP]

# 2. 프로젝트 디렉토리로 이동
cd /home/ec2-user/mingling_new

# 3. 긴급 업데이트 실행
bash emergency-restart.sh
```

### 방법 2: 단계별 수동 업데이트

```bash
# 1. EC2 접속 후
cd /home/ec2-user/mingling_new

# 2. 최신 코드 가져오기
git fetch origin
git reset --hard origin/main

# 3. 백엔드 의존성 업데이트
cd backend
npm install --production

# 4. PM2 완전 재시작
pm2 delete all
sleep 3
PORT=8001 NODE_ENV=production pm2 start index.js --name "mingling-backend"

# 5. 상태 확인
pm2 status
curl http://localhost:8001/api/health
```

### 방법 3: GitHub Actions 트리거 (권장)

현재 저장소에 최신 코드가 푸시되었으므로, GitHub Actions 워크플로우를 수동으로 트리거하면 자동 배포될 수 있습니다.

## 🧪 업데이트 후 검증 명령어

```bash
# EC2 서버에서 실행
curl http://localhost:8001/api/health
curl http://localhost:8001/api/debug/stats
curl http://localhost:8001/api/environment
curl -X POST http://localhost:8001/api/payment/verify \
  -H "Content-Type: application/json" \
  -H "X-User-Id: test-123" \
  -H "X-User-Email: test@test.com" \
  -d '{"imp_uid": "test_payment", "merchant_uid": "test_order"}'
```

## 📋 업데이트 후 확인사항

### ✅ 체크리스트
- [ ] 헬스체크 API 정상 응답
- [ ] 결제 검증 API 정상 응답 (테스트 모드)
- [ ] 환경 정보 API 정상 응답
- [ ] OpenAI 대화 생성 정상 작동
- [ ] 서버 통계 정상 업데이트
- [ ] 클라우드플레어 캐시 무효화

### 🚨 필수 환경변수 확인
```bash
# EC2에서 확인
printenv | grep -E "NODE_ENV|IMP_SECRET|OPENAI_API_KEY|DATABASE_URL"
```

## 🎯 예상 효과

업데이트 후 다음 기능들이 정상 작동할 것으로 예상됩니다:

1. **결제 시스템** - 포트원 연동 완전 작동
   - 테스트 결제 검증 ✅
   - 실제 결제 검증 ✅
   - 하트 충전 시스템 ✅

2. **대화 기능** - OpenAI 연동 완전 작동
   - 캐릭터 응답 생성 ✅
   - 페르소나 기반 대화 ✅
   - 호감도 시스템 ✅

3. **시스템 모니터링** - 상태 확인 기능
   - 환경 변수 검증 ✅
   - 배포 상태 확인 ✅
   - 실시간 통계 ✅

## ⏰ 긴급도: HIGH

**즉시 업데이트 권장** - 결제 시스템 불작동으로 인한 서비스 영향 발생 중

---

**업데이트 담당자**: 서버 관리자
**확인 방법**: https://api.minglingchat.com/api/health (버전 1.1.0 이상 확인)
**문의**: GitHub Issues 또는 배포 로그 확인 