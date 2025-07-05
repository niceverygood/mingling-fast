#!/bin/bash

# EC2 백엔드 업데이트 스크립트
# 사용법: ./update-backend.sh

echo "🚀 Mingling 백엔드 업데이트 시작..."

# 현재 디렉토리 확인
if [ ! -d "backend" ]; then
    echo "❌ 백엔드 디렉토리가 없습니다. 프로젝트 루트에서 실행하세요."
    exit 1
fi

# Git 변경사항 확인
echo "📥 Git에서 최신 코드 가져오기..."
git fetch origin

# 로컬 변경사항이 있는지 확인
if ! git diff --quiet HEAD origin/main; then
    echo "📋 업데이트 가능한 변경사항이 있습니다."
    git pull origin main
    
    # 의존성 업데이트 확인
    if [ -f "backend/package.json" ]; then
        echo "📦 의존성 업데이트 확인 중..."
        cd backend
        npm install
        cd ..
    fi
    
    # 프로세스 재시작
    echo "🔄 백엔드 서버 재시작..."
    
    # PM2를 사용하는 경우
    if command -v pm2 &> /dev/null; then
        echo "PM2로 서버 재시작 중..."
        pm2 restart mingling-backend || pm2 start backend/index.js --name mingling-backend
    else
        echo "⚠️  PM2가 설치되지 않았습니다. 수동으로 서버를 재시작하세요."
        echo "명령어: cd backend && npm start"
    fi
    
    echo "✅ 백엔드 업데이트 완료!"
else
    echo "✅ 이미 최신 버전입니다."
fi

echo "🏥 서버 상태 확인..."
sleep 3
curl -s http://localhost:8001/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ 서버가 정상 작동 중입니다."
else
    echo "❌ 서버 상태 확인 실패. 수동으로 확인하세요."
fi

echo "🎉 업데이트 프로세스 완료!" 