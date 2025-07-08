# 🔧 GitHub Actions SSH 연결 문제 해결 가이드

## 🚨 현재 문제 상황
- **에러**: `dial tcp ***:22: i/o timeout`
- **원인**: GitHub Actions가 Cloudflare IP로 SSH 연결 시도
- **해결 필요**: GitHub Secrets에서 EC2_HOST를 실제 EC2 퍼블릭 IP로 변경

## 📋 해결 단계

### 1. EC2 실제 퍼블릭 IP 확인

#### 방법 A: AWS 콘솔에서 확인
1. AWS 콘솔 로그인
2. EC2 → 인스턴스 → `i-0dd948ee8f2c1a740` 선택
3. **퍼블릭 IPv4 주소** 복사

#### 방법 B: AWS CLI로 확인 (로컬에서)
```bash
aws ec2 describe-instances \
  --region ap-northeast-2 \
  --instance-ids i-0dd948ee8f2c1a740 \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

#### 방법 C: EC2 내부에서 확인 (SSH 접속 가능한 경우)
```bash
curl -s http://169.254.169.254/latest/meta-data/public-ipv4
```

### 2. GitHub Secrets 업데이트

1. **GitHub 저장소 → Settings → Secrets and variables → Actions**
2. 다음 Secrets 확인/업데이트:

```
EC2_HOST: [실제 EC2 퍼블릭 IP]  # 예: 13.124.xxx.xxx
EC2_USERNAME: ec2-user          # Amazon Linux 기본 사용자
EC2_SSH_KEY: [PEM 키 내용]      # mingling_new.pem 파일 전체 내용
```

### 3. SSH 키 설정 확인

#### PEM 키 내용 복사
```bash
cat mingling_new.pem
```

**중요**: 
- `-----BEGIN RSA PRIVATE KEY-----` 부터
- `-----END RSA PRIVATE KEY-----` 까지 
- 모든 내용을 복사해서 `EC2_SSH_KEY`에 입력

### 4. 수동 배포 테스트

#### GitHub Actions에서 수동 실행
1. **Actions 탭 → Deploy Backend to EC2**
2. **Run workflow** 버튼 클릭
3. **main** 브랜치 선택 후 실행

## 🔍 일반적인 EC2 IP 패턴

AWS 서울 리전(ap-northeast-2)의 일반적인 IP 범위:
- `13.124.x.x` - `13.125.x.x`
- `15.164.x.x` - `15.165.x.x`
- `52.78.x.x` - `52.79.x.x`

**현재 감지된 문제**: `api.minglingchat.com`이 Cloudflare IP(`104.21.35.144`, `172.67.175.188`)로 해석됨

## 🛠️ 대안 해결책

### 방법 1: 직접 SSH 접속 후 수동 배포
```bash
# 실제 EC2 IP 찾기 (AWS 콘솔에서)
ssh -i mingling_new.pem ec2-user@[실제_EC2_IP]

# 수동 배포 실행
cd /home/ec2-user/mingling_new
bash emergency-restart.sh
```

### 방법 2: GitHub Actions 없이 배포
```bash
# 로컬에서 EC2로 직접 배포
rsync -avz -e "ssh -i mingling_new.pem" \
  ./backend/ ec2-user@[실제_EC2_IP]:~/backend/

ssh -i mingling_new.pem ec2-user@[실제_EC2_IP] \
  "cd ~/backend && npm install && pm2 restart mingling-backend"
```

### 방법 3: Webhook 배포 사용
EC2에서 webhook 서버를 실행해서 GitHub push 이벤트로 자동 배포

## 🧪 연결 테스트 명령어

### SSH 연결 테스트
```bash
# 타임아웃 5초로 빠른 테스트
timeout 5 ssh -o ConnectTimeout=3 -i mingling_new.pem ec2-user@[EC2_IP] "echo 'Connection successful'"
```

### 포트 확인
```bash
# SSH 포트 22 테스트
nc -zv [EC2_IP] 22

# 또는 telnet
telnet [EC2_IP] 22
```

## 📊 현재 수정된 워크플로우 개선사항

1. ✅ **올바른 리포지토리**: `mingling_new` 사용
2. ✅ **타임아웃 증가**: 120초로 연장
3. ✅ **디버깅 강화**: 연결 정보 및 에러 로깅
4. ✅ **에러 처리**: 실패 시 상세 로그 출력
5. ✅ **환경변수 검증**: 필수 환경변수 확인
6. ✅ **수동 실행**: `workflow_dispatch` 추가

## ⚠️ 주의사항

1. **보안**: PEM 키는 GitHub Secrets에서만 관리
2. **IP 변경**: EC2 재시작 시 퍼블릭 IP 변경될 수 있음
3. **방화벽**: AWS 보안 그룹에서 SSH(22) 포트 허용 확인

## 🎯 다음 단계

1. **EC2 실제 IP 확인** (AWS 콘솔 필수)
2. **GitHub Secrets 업데이트**
3. **워크플로우 수동 실행**
4. **연결 성공 시 자동 배포 활성화**

---

**긴급도**: HIGH  
**완료 예상 시간**: 10-15분  
**담당**: GitHub 저장소 관리자 