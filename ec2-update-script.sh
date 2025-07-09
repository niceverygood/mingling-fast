#!/bin/bash

echo "🔄 백엔드 서버 업데이트 중..."

# 프로젝트 디렉토리로 이동
cd /home/ec2-user/mingling_new

# 최신 코드 가져오기
echo "📥 최신 코드 가져오는 중..."
git pull origin main

# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 기존 서버 종료
echo "🛑 기존 서버 종료..."
pkill -f 'node.*index.js' || echo "종료할 프로세스 없음"

# 잠시 대기
sleep 3

# 새 서버 시작
echo "🚀 새 서버 시작..."
nohup node index.js > /home/ec2-user/backend.log 2>&1 &

# 서버 시작 대기
sleep 5

# 서버 상태 확인
echo "📊 서버 상태 확인:"
ps aux | grep node | grep -v grep

# API 헬스체크
echo "🔍 API 헬스체크:"
curl -s http://localhost:8001/api/health | jq . || curl -s http://localhost:8001/api/health

echo "✅ 백엔드 배포 완료!" 