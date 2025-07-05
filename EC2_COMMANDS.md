# EC2 백엔드 업데이트 명령어 가이드

## 🚀 자동 업데이트 (권장)

```bash
# 프로젝트 디렉토리로 이동
cd /home/ubuntu/mingling_new

# 자동 업데이트 스크립트 실행
./update-backend.sh
```

## 🔧 수동 업데이트

### 1. 기본 Git 업데이트
```bash
# 프로젝트 디렉토리로 이동
cd /home/ubuntu/mingling_new

# 최신 코드 가져오기
git pull origin main

# 의존성 업데이트
cd backend
npm install
```

### 2. 환경 변수 설정 (최초 1회)
```bash
# 백엔드 디렉토리에 .env 파일 생성
nano backend/.env

# 다음 내용 입력:
DATABASE_URL="mysql://admin:Mingle123!@mingling-db.cdmmsa0o2tp2.ap-northeast-2.rds.amazonaws.com:3306/mingling"
OPENAI_API_KEY="your-openai-api-key"
JWT_SECRET="mingling-jwt-secret-2024"
NODE_ENV="production"
PORT=8001
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,https://minglingchat.com,https://www.minglingchat.com"
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_REGION="ap-northeast-2"
AWS_S3_BUCKET_NAME="mingling-new"
PORTONE_API_URL="https://api.iamport.kr"
IMP_KEY="TEST_KEY"
IMP_SECRET="TEST_SECRET"
```

### 3. PM2로 서버 관리

#### PM2 설치 (최초 1회)
```bash
sudo npm install -g pm2
```

#### 서버 시작
```bash
cd /home/ubuntu/mingling_new/backend
pm2 start index.js --name mingling-backend
```

#### 서버 재시작
```bash
pm2 restart mingling-backend
```

#### 서버 상태 확인
```bash
pm2 status
pm2 logs mingling-backend
```

#### 서버 중지
```bash
pm2 stop mingling-backend
```

### 4. 직접 실행 (개발/테스트용)
```bash
cd /home/ubuntu/mingling_new/backend
npm start
```

## 🏥 서버 상태 확인

```bash
# 서버 응답 확인
curl http://localhost:8001/api/health

# 포트 사용 확인
sudo netstat -tlnp | grep :8001

# 프로세스 확인
ps aux | grep node
```

## 🔍 트러블슈팅

### 포트 충돌 해결
```bash
# 8001 포트 사용 프로세스 확인
sudo lsof -i :8001

# 프로세스 종료
sudo kill -9 <PID>
```

### 로그 확인
```bash
# PM2 로그
pm2 logs mingling-backend

# 직접 실행 시 로그
cd /home/ubuntu/mingling_new/backend
npm start 2>&1 | tee server.log
```

### 데이터베이스 연결 확인
```bash
# MySQL 연결 테스트
mysql -h mingling-db.cdmmsa0o2tp2.ap-northeast-2.rds.amazonaws.com -u admin -pMingle123! -e "SHOW DATABASES;"
```

## 📝 주의사항

1. **환경 변수**: `.env` 파일이 올바르게 설정되어 있는지 확인
2. **포트 설정**: 8001 포트가 사용 가능한지 확인
3. **권한**: 파일 권한 문제가 있을 경우 `chmod +x update-backend.sh`
4. **방화벽**: AWS 보안 그룹에서 8001 포트가 열려있는지 확인
5. **메모리**: t3.micro 인스턴스의 메모리 사용량 모니터링

## 🎯 권장 워크플로우

1. 로컬에서 코드 변경 후 Git 푸시
2. EC2에서 `./update-backend.sh` 실행
3. 서버 상태 확인: `curl http://localhost:8001/api/health`
4. 문제 발생 시 로그 확인: `pm2 logs mingling-backend` 