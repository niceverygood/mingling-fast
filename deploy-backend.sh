#!/bin/bash

# 🚀 EC2 백엔드 자동 배포 스크립트
# 사용법: ./deploy-backend.sh

set -e  # 오류 발생 시 스크립트 중단

echo "=== 🚀 EC2 백엔드 자동 배포 시작 ==="

# 설정
EC2_HOST="ec2-13-125-231-217.ap-northeast-2.compute.amazonaws.com"
EC2_USER="ec2-user"
PROJECT_PATH="/home/ec2-user/mingling_new"
SSH_KEY="${HOME}/.ssh/minglingchat.pem"

# SSH 키 확인
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH 키를 찾을 수 없습니다: $SSH_KEY"
    echo "💡 다음 중 하나를 확인하세요:"
    echo "   - AWS 콘솔에서 키 페어 다운로드"
    echo "   - 키 파일 경로가 올바른지 확인"
    exit 1
fi

# SSH 키 권한 설정
chmod 400 "$SSH_KEY"

echo "📋 배포 정보:"
echo "  - 호스트: $EC2_HOST"
echo "  - SSH 키: $SSH_KEY"
echo "  - 프로젝트 경로: $PROJECT_PATH"

echo -e "\n🔄 EC2 서버에 배포 중..."

# SSH를 통해 원격 배포 실행
ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" << 'EOF'
set -e

echo "📁 프로젝트 디렉토리로 이동..."
cd /home/ec2-user/mingling_new

echo "🔄 최신 코드 가져오기..."
git pull origin main

echo "📦 백엔드 디렉토리로 이동..."
cd backend

echo "📋 의존성 확인..."
npm install

echo "🛑 기존 백엔드 프로세스 종료..."
pkill -f 'node.*index.js' || echo "종료할 프로세스 없음"

echo "⏳ 프로세스 종료 대기..."
sleep 3

echo "🚀 백엔드 서버 시작..."
nohup node index.js > /home/ec2-user/backend.log 2>&1 &

echo "⏳ 서버 부팅 대기..."
sleep 5

echo "📊 프로세스 상태 확인..."
ps aux | grep node | grep -v grep | head -5

echo "🔍 서버 상태 확인..."
curl -s http://localhost:8001/api/health | jq . || echo "jq 없음 - 원시 응답:"

echo "📋 최근 로그 확인..."
tail -n 10 /home/ec2-user/backend.log

echo "✅ 배포 완료!"
EOF

echo -e "\n🎉 EC2 백엔드 배포 완료!"
echo "📊 배포 결과 확인:"
echo "  - API 상태: https://api.minglingchat.com/api/health"
echo "  - 결제 테스트: https://www.minglingchat.com"

echo -e "\n🔍 배포 후 확인 사항:"
echo "  1. API 엔드포인트 응답 확인"
echo "  2. 결제 시스템 테스트"
echo "  3. 로그 파일 모니터링"

echo -e "\n📋 유용한 명령어:"
echo "  - 로그 확인: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'tail -f /home/ec2-user/backend.log'"
echo "  - 서버 재시작: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'pkill -f node && cd /home/ec2-user/mingling_new/backend && nohup node index.js > /home/ec2-user/backend.log 2>&1 &'"
echo "  - 프로세스 확인: ssh -i $SSH_KEY $EC2_USER@$EC2_HOST 'ps aux | grep node'" 