#!/bin/bash
# 🚀 EC2 백엔드 원클릭 배포
ssh -i ~/.ssh/minglingchat.pem ec2-user@ec2-13-125-231-217.ap-northeast-2.compute.amazonaws.com << 'EOF'
echo "🔄 백엔드 서버 업데이트 중..."
cd /home/ec2-user/mingling_new
git pull origin main
cd backend
npm install
echo "🛑 기존 서버 종료..."
pkill -f 'node.*index.js' || echo '종료할 프로세스 없음'
sleep 3
echo "🚀 새 서버 시작..."
nohup node index.js > /home/ec2-user/backend.log 2>&1 &
sleep 5
echo "📊 서버 상태 확인:"
ps aux | grep node | grep -v grep
echo "🔍 API 헬스체크:"
curl -s http://localhost:8001/api/health | jq . || curl -s http://localhost:8001/api/health
echo "✅ 백엔드 배포 완료!"
EOF
