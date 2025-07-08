# 🔧 EC2 보안 그룹 설정 문제 해결 가이드

## 문제 상황
- EC2 로컬: 버전 1.1.0 정상 응답 ✅
- Cloudflare: 버전 1.0.7 응답 ❌
- 원인: **보안 그룹이 포트 8001 외부 접근을 차단**

## 해결 방법

### 1. AWS 콘솔 접속
1. AWS Console → EC2 → 인스턴스
2. 인스턴스 ID: `i-0dd948ee8f2c1a740` 선택
3. 하단 **보안** 탭 → 보안 그룹 클릭

### 2. 보안 그룹 규칙 확인
현재 **인바운드 규칙**에서 포트 8001이 허용되어 있는지 확인:

```
TYPE        PROTOCOL    PORT RANGE    SOURCE
HTTP        TCP         80           0.0.0.0/0
HTTPS       TCP         443          0.0.0.0/0
SSH         TCP         22           0.0.0.0/0
Custom TCP  TCP         8001         0.0.0.0/0  ← 이 규칙이 있는지 확인!
```

### 3. 규칙 추가 (없는 경우)
1. **인바운드 규칙 편집** 클릭
2. **규칙 추가** 클릭
3. 설정:
   - **유형**: 사용자 지정 TCP
   - **프로토콜**: TCP
   - **포트 범위**: 8001
   - **소스**: 0.0.0.0/0 (모든 IP)
   - **설명**: Mingling Backend API
4. **규칙 저장** 클릭

### 4. Cloudflare Origin 설정 확인
1. Cloudflare Dashboard → DNS 설정
2. A 레코드 확인:
   ```
   api.minglingchat.com → [EC2 퍼블릭 IP]:8001
   ```
3. **프록시 상태**: 🟠 (프록시됨) 확인

### 5. 즉시 테스트
```bash
# EC2 퍼블릭 IP로 직접 접근
curl -s http://[EC2_PUBLIC_IP]:8001/api/health

# Cloudflare 통해 접근
curl -s https://api.minglingchat.com/api/health
```

## 예상 결과
- ✅ 두 요청 모두 버전 1.1.0 응답
- ✅ 결제 API 정상 동작
- ✅ 모든 새 엔드포인트 접근 가능

## 추가 확인사항
- EC2 내부 방화벽 (iptables) 확인
- Node.js 서버 바인딩 주소 확인 (0.0.0.0 vs 127.0.0.1)
- PM2 프로세스 상태 확인 