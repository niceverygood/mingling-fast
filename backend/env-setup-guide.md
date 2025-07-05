# 환경 변수 설정 가이드

## 1. 백엔드 디렉토리에 .env 파일 생성

`backend/.env` 파일을 생성하고 다음 내용을 입력하세요:

```bash
# Database
DATABASE_URL="mysql://admin:Mingle123!@mingling-db.cdmmsa0o2tp2.ap-northeast-2.rds.amazonaws.com:3306/mingling"

# OpenAI
OPENAI_API_KEY="your-openai-api-key-here"

# JWT
JWT_SECRET="mingling-jwt-secret-2024"

# Server
NODE_ENV="development"
PORT=8001
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3001,https://minglingchat.com,https://www.minglingchat.com"

# AWS S3 설정 (IAM에서 생성한 실제 값으로 교체)
AWS_ACCESS_KEY_ID="your-aws-access-key-id"
AWS_SECRET_ACCESS_KEY="your-aws-secret-access-key"
AWS_REGION="ap-northeast-2"
AWS_S3_BUCKET_NAME="mingling-new"

# Payment (포트원)
PORTONE_API_URL="https://api.iamport.kr"
IMP_KEY="TEST_KEY"
IMP_SECRET="TEST_SECRET"
```

## 2. AWS 자격 증명 교체

위에서 생성한 IAM 사용자의 실제 액세스 키로 교체하세요:
- `AWS_ACCESS_KEY_ID`: IAM에서 생성한 액세스 키 ID
- `AWS_SECRET_ACCESS_KEY`: IAM에서 생성한 비밀 액세스 키

## 3. 서버 시작

```bash
cd backend
npm start
```

환경 변수가 올바르게 설정되면 S3 업로드가 정상 작동합니다. 