# 🌐 Mingling 환경 변수 설정 가이드

## 📋 필수 환경 변수

### 🔧 기본 서버 설정
```bash
# 환경 설정
NODE_ENV=production
PORT=8001

# JWT 보안 설정
JWT_SECRET="your_strong_jwt_secret_key"
```

### 🗄️ 데이터베이스 설정
```bash
# RDS MySQL 연결
DATABASE_URL="mysql://admin:Mingle123!@mingling-db.cdmmsa0o2tp2.ap-northeast-2.rds.amazonaws.com:3306/mingling"
```

### 🌐 CORS 설정
```bash
# 허용된 도메인들
ALLOWED_ORIGINS="https://www.minglingchat.com,https://minglingchat.com,https://mingling-new.vercel.app"
```

### 🤖 OpenAI API 설정
```bash
# OpenAI API 키
OPENAI_API_KEY="your_openai_api_key"
```

## 💳 결제 시스템 환경 변수 (포트원)

### 🔐 포트원 API 설정
```bash
# 포트원 기본 설정
PORTONE_API_URL="https://api.iamport.kr"
IMP_KEY="imp20122888"
IMP_SECRET="your_portone_secret_key"

# PG 및 채널 설정
CHANNEL_KEY="channel-key-720d69be-767a-420c-91c8-2855ca00192d"
PG_PROVIDER="html5_inicis"
MERCHANT_ID="MOIplay998"
```

## ☁️ AWS S3 설정 (파일 업로드)

### 📁 S3 버킷 설정
```bash
# AWS 자격 증명
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
AWS_REGION="ap-northeast-2"
AWS_S3_BUCKET_NAME="mingling-new"
```

## 🌍 환경별 설정

### 🚀 프로덕션 환경 (EC2)
```bash
# 기본 설정
NODE_ENV=production
PORT=8001

# 데이터베이스
DATABASE_URL="mysql://admin:Mingle123!@mingling-db.cdmmsa0o2tp2.ap-northeast-2.rds.amazonaws.com:3306/mingling"

# CORS (프로덕션 도메인만)
ALLOWED_ORIGINS="https://www.minglingchat.com,https://minglingchat.com,https://mingling-new.vercel.app"

# API 키들
OPENAI_API_KEY="your_production_openai_key"
JWT_SECRET="your_production_jwt_secret"
IMP_SECRET="your_production_imp_secret"

# AWS S3
AWS_ACCESS_KEY_ID="your_production_aws_key"
AWS_SECRET_ACCESS_KEY="your_production_aws_secret"
AWS_REGION="ap-northeast-2"
AWS_S3_BUCKET_NAME="mingling-new"
```

### 🔧 개발 환경 (로컬)
```bash
# 기본 설정
NODE_ENV=development
PORT=8001

# 데이터베이스 (로컬 또는 개발용)
DATABASE_URL="mysql://localhost:3306/mingling_dev"

# CORS (로컬 개발 포트들)
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,http://localhost:3005"

# API 키들
OPENAI_API_KEY="your_development_openai_key"
JWT_SECRET="your_development_jwt_secret"
IMP_SECRET="your_development_imp_secret"
```

## 🛠️ 환경 변수 설정 방법

### 1. EC2 환경에서 설정
```bash
# PM2 ecosystem 파일 사용 (권장)
sudo nano /home/ec2-user/mingling_new/ecosystem.config.js

# 또는 /etc/environment 파일 편집
sudo nano /etc/environment
```

### 2. 로컬 개발 환경에서 설정
```bash
# backend 디렉토리에서 .env 파일 생성
cd backend
touch .env

# .env 파일에 환경 변수 추가
echo "NODE_ENV=development" >> .env
echo "PORT=8001" >> .env
# ... 기타 환경 변수들
```

## 📊 PM2 Ecosystem 설정 예시

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'mingling-backend',
    script: 'index.js',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 8001,
      DATABASE_URL: 'mysql://admin:Mingle123!@mingling-db.cdmmsa0o2tp2.ap-northeast-2.rds.amazonaws.com:3306/mingling',
      OPENAI_API_KEY: 'your_openai_key',
      JWT_SECRET: 'your_jwt_secret',
      ALLOWED_ORIGINS: 'https://www.minglingchat.com,https://minglingchat.com,https://mingling-new.vercel.app',
      IMP_SECRET: 'your_imp_secret',
      AWS_ACCESS_KEY_ID: 'your_aws_key',
      AWS_SECRET_ACCESS_KEY: 'your_aws_secret',
      AWS_REGION: 'ap-northeast-2',
      AWS_S3_BUCKET_NAME: 'mingling-new'
    }
  }]
};
```

## 🔍 환경 변수 검증

서버 시작 시 다음 환경 변수들이 자동으로 검증됩니다:

### ✅ 필수 환경 변수
- `NODE_ENV` - 환경 구분
- `PORT` - 서버 포트
- `DATABASE_URL` - 데이터베이스 연결
- `OPENAI_API_KEY` - OpenAI API 키
- `JWT_SECRET` - JWT 보안 키
- `ALLOWED_ORIGINS` - CORS 허용 도메인

### ⚠️ 선택적 환경 변수
- `IMP_SECRET` - 결제 시스템 사용 시 필요
- `AWS_ACCESS_KEY_ID` - 파일 업로드 사용 시 필요
- `AWS_SECRET_ACCESS_KEY` - 파일 업로드 사용 시 필요

## 🚨 보안 주의사항

1. **환경 변수 노출 방지**: 실제 키 값들은 절대 코드나 공개 저장소에 노출하지 마세요
2. **프로덕션 키 분리**: 개발용과 프로덕션용 키를 분리하여 관리하세요
3. **정기적 키 갱신**: 보안을 위해 정기적으로 키를 갱신하세요
4. **접근 권한 관리**: AWS IAM 등에서 최소 권한 원칙을 적용하세요

## 🔧 트러블슈팅

### 환경 변수 누락 시
```bash
# 서버 로그에서 확인
pm2 logs mingling-backend

# 환경 변수 확인
printenv | grep -E "NODE_ENV|PORT|DATABASE_URL|OPENAI_API_KEY"
```

### 데이터베이스 연결 실패 시
```bash
# MySQL 연결 테스트
mysql -h mingling-db.cdmmsa0o2tp2.ap-northeast-2.rds.amazonaws.com -u admin -pMingle123!
```

### CORS 에러 발생 시
1. `ALLOWED_ORIGINS` 환경 변수 확인
2. 도메인 정확성 검증
3. 서버 재시작 후 재테스트

## 🎯 빠른 설정 체크리스트

### 프로덕션 배포 시
- [ ] `NODE_ENV=production` 설정
- [ ] `ALLOWED_ORIGINS`에 프로덕션 도메인만 포함
- [ ] 실제 프로덕션 API 키들 사용
- [ ] 데이터베이스 연결 정보 확인
- [ ] 서버 재시작 후 헬스체크 실행

### 개발 환경 설정 시
- [ ] `NODE_ENV=development` 설정
- [ ] `ALLOWED_ORIGINS`에 로컬 포트들 포함
- [ ] 개발용 API 키들 사용
- [ ] 로컬 데이터베이스 또는 개발용 DB 연결

---

📞 **지원 및 문의**: 환경 설정 중 문제가 발생하면 GitHub Issues나 배포 로그를 확인하세요. 