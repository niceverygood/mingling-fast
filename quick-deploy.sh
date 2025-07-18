#!/bin/bash

# Quick Deploy Script - Git Push + EC2 Deploy
# Usage: ./quick-deploy.sh "commit message"

if [ -z "$1" ]; then
  echo "❌ 커밋 메시지를 입력해주세요."
  echo "사용법: ./quick-deploy.sh \"커밋 메시지\""
  exit 1
fi

COMMIT_MESSAGE="$1"

echo "🚀 밍글링 빠른 배포 시작..."
echo "📝 커밋 메시지: $COMMIT_MESSAGE"
echo

# 1. Git 푸시 및 Vercel 자동 배포
echo "1️⃣ Git 푸시 및 프론트엔드 배포 중..."
./deploy.sh "$COMMIT_MESSAGE"

if [ $? -ne 0 ]; then
  echo "❌ Git 푸시 실패!"
  exit 1
fi

echo "✅ Git 푸시 및 프론트엔드 배포 완료"
echo

# 2. EC2 백엔드 배포
echo "2️⃣ EC2 백엔드 배포 중..."
echo "📡 EC2 서버에 연결하여 배포 실행..."

# EC2 배포 명령어 (백그라운드 프로세스 후 세미콜론 사용)
ssh ec2-user@43.201.103.84 "cd /home/ec2-user/mingling_new; git pull origin main; cd backend; npm install; pkill -f 'node.*index.js'; sleep 3; nohup node index.js > /home/ec2-user/backend.log 2>&1 & sleep 5; ps aux | grep node | grep -v grep; curl -s http://localhost:8001/api/health"

if [ $? -eq 0 ]; then
  echo "✅ EC2 백엔드 배포 완료"
  echo
  echo "🎉 전체 배포 성공!"
  echo "🌐 프론트엔드: https://www.minglingchat.com"
  echo "🔧 백엔드: https://api.minglingchat.com"
else
  echo "❌ EC2 백엔드 배포 실패"
  echo "💡 수동으로 EC2 콘솔에서 확인해주세요"
  exit 1
fi 