#!/bin/bash

# EC2 환경변수 설정 스크립트 (보안 버전)
# 사용법: bash ec2-env-setup-secure.sh
# ⚠️ 실제 사용 전에 API 키 값들을 실제 값으로 수정 필요

set -e  # 에러 발생 시 스크립트 종료

echo "🔧 EC2 환경변수 설정 시작..."

# API 키 값들 (실제 사용 시 변경 필요)
OPENAI_KEY="sk-proj-YOUR_ACTUAL_OPENAI_KEY_HERE"
IMP_SECRET_KEY="YOUR_ACTUAL_IMP_SECRET_HERE"  
AWS_ACCESS_KEY="YOUR_ACTUAL_AWS_ACCESS_KEY_HERE"
AWS_SECRET_KEY="YOUR_ACTUAL_AWS_SECRET_KEY_HERE"

echo "⚠️  중요: 실제 API 키 값으로 변경해주세요!"
echo "   OPENAI_KEY: $OPENAI_KEY"
echo "   IMP_SECRET_KEY: $IMP_SECRET_KEY"
echo "   AWS_ACCESS_KEY: $AWS_ACCESS_KEY"
echo "   AWS_SECRET_KEY: $AWS_SECRET_KEY"
echo ""

read -p "실제 API 키로 변경하셨나요? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 스크립트를 종료합니다. 먼저 API 키를 실제 값으로 변경해주세요."
    exit 1
fi

# 1단계: 최신 코드 가져오기
echo "📥 최신 코드 가져오기..."
cd /home/ec2-user/mingling_new
git pull origin main

# 2단계: 환경변수 설정 (히스토리 확장 비활성화)
echo "🔧 환경변수 설정 중..."
set +H  # 히스토리 확장 비활성화

export NODE_ENV=production
export PORT=8001
export OPENAI_API_KEY="$OPENAI_KEY"
export JWT_SECRET="mingling-super-secret-jwt-key-2024"
export ALLOWED_ORIGINS="https://www.minglingchat.com,https://minglingchat.com,https://mingling-new.vercel.app"
export IMP_SECRET="$IMP_SECRET_KEY"
export AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY"
export AWS_SECRET_ACCESS_KEY="$AWS_SECRET_KEY"
export AWS_REGION="ap-northeast-2"
export AWS_BUCKET="mingling-s3-user"

# DATABASE_URL을 별도로 설정 (히스토리 확장 문제 방지)
DB_HOST="mingling-db.cdmmsa0o2tp2.ap-northeast-2.rds.amazonaws.com"
DB_USER="admin"
DB_PASS="Mingle123!"
DB_NAME="mingling"
DB_PORT="3306"
export DATABASE_URL="mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo "✅ 환경변수 설정 완료"

# 3단계: .env 파일 생성
echo "📝 .env 파일 생성 중..."
cat > /home/ec2-user/mingling_new/backend/.env << EOF
NODE_ENV=production
PORT=8001
OPENAI_API_KEY="$OPENAI_KEY"
JWT_SECRET="mingling-super-secret-jwt-key-2024"
ALLOWED_ORIGINS="https://www.minglingchat.com,https://minglingchat.com,https://mingling-new.vercel.app"
IMP_SECRET="$IMP_SECRET_KEY"
AWS_ACCESS_KEY_ID="$AWS_ACCESS_KEY"
AWS_SECRET_ACCESS_KEY="$AWS_SECRET_KEY"
AWS_REGION="ap-northeast-2"
AWS_BUCKET="mingling-s3-user"
DATABASE_URL="mysql://admin:Mingle123!@mingling-db.cdmmsa0o2tp2.ap-northeast-2.rds.amazonaws.com:3306/mingling"
EOF

echo "✅ .env 파일 생성 완료"

# 4단계: 백엔드 디렉토리 이동 및 의존성 설치
echo "📦 의존성 설치 중..."
cd /home/ec2-user/mingling_new/backend
npm install --production

# 5단계: 기존 프로세스 완전 종료
echo "🔄 기존 프로세스 종료 중..."
pkill -f 'node.*index.js' || echo "종료할 프로세스 없음"
sleep 3

# 6단계: 새 서버 시작
echo "🚀 새 서버 시작 중..."
nohup node index.js > /home/ec2-user/backend.log 2>&1 &
sleep 5

# 7단계: 서버 상태 확인
echo "🔍 서버 상태 확인 중..."
ps aux | grep node | grep -v grep

# 8단계: Health Check
echo "🩺 Health Check 실행 중..."
curl -s http://localhost:8001/api/health | head -20 || echo "Health check 실패 - 로그 확인 필요"

echo ""
echo "🎉 EC2 환경변수 설정 및 서버 재시작 완료!"
echo "📋 추가 확인사항:"
echo "   - 로그 확인: tail -f /home/ec2-user/backend.log"
echo "   - 프로세스 확인: ps aux | grep node"
echo "   - Health Check: curl http://localhost:8001/api/health"

set -H  # 히스토리 확장 다시 활성화 