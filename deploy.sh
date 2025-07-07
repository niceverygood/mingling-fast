#!/bin/bash

# 🚀 Mingling Backend 자동 배포 스크립트
# EC2에서 실행: bash deploy.sh

set -e  # 에러 발생 시 스크립트 중단

echo "🚀 Starting deployment process..."
echo "📅 $(date)"

# 1. 최신 코드 가져오기
echo "📥 Fetching latest code..."
cd /home/ec2-user/mingling_new
git fetch origin
git reset --hard origin/main

# 2. 의존성 업데이트 (필요한 경우)
echo "📦 Checking dependencies..."
cd backend
npm install --production

# 3. PM2 프로세스 완전 재시작
echo "🔄 Restarting PM2 processes..."
pm2 delete all || true
sleep 3

# 4. 새 프로세스 시작
echo "▶️  Starting new process..."
PORT=8001 pm2 start index.js --name "mingling-backend"

# 5. 상태 확인
echo "📊 Checking status..."
pm2 status

# 6. 헬스 체크
echo "🏥 Health check..."
sleep 5
curl -f http://localhost:8001/api/health || {
  echo "❌ Health check failed!"
  pm2 logs mingling-backend --lines 20
  exit 1
}

echo "✅ Deployment completed successfully!"
echo "🌐 Server is running on port 8001"
echo "📊 Check stats: curl http://localhost:8001/api/debug/stats" 