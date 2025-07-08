#!/bin/bash

# 🚀 Mingling 통합 배포 스크립트
# 사용법: ./deploy.sh "커밋 메시지"

set -e

echo "=== 🚀 Mingling 통합 배포 시작 ==="

# 커밋 메시지 확인
COMMIT_MESSAGE="$1"
if [ -z "$COMMIT_MESSAGE" ]; then
    echo "❌ 커밋 메시지가 필요합니다."
    echo "사용법: ./deploy.sh \"커밋 메시지\""
    exit 1
fi

# 현재 시간
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

echo "📝 커밋 메시지: $COMMIT_MESSAGE"
echo "⏰ 배포 시간: $TIMESTAMP"

# 1단계: Git 작업
echo -e "\n1️⃣ Git 변경사항 처리..."
echo "📋 변경된 파일 목록:"
git status --porcelain

echo "📦 모든 변경사항 스테이징..."
git add -A

echo "💾 커밋 생성..."
git commit -m "$COMMIT_MESSAGE

🚀 Auto-deployed at $TIMESTAMP"

echo "🔄 GitHub로 푸시..."
git push origin main

echo "✅ Git 푸시 완료!"

# 2단계: 프론트엔드 배포 정보
echo -e "\n2️⃣ 프론트엔드 배포..."
echo "📡 Vercel 자동 배포 진행 중..."
echo "🌐 프론트엔드 URL: https://www.minglingchat.com"
echo "⏳ 보통 1-2분 내에 배포가 완료됩니다."

# 3단계: 백엔드 배포 명령어 안내
echo -e "\n3️⃣ 백엔드 수동 배포 명령어:"
echo "다음 명령어를 복사해서 실행하세요:"
echo ""
echo "ssh -i ~/.ssh/minglingchat.pem ec2-user@ec2-13-125-231-217.ap-northeast-2.compute.amazonaws.com << 'EOF'"
echo "echo '🔄 백엔드 서버 업데이트 중...'"
echo "cd /home/ec2-user/mingling_new"
echo "git pull origin main"
echo "cd backend"
echo "npm install"
echo "echo '🛑 기존 서버 종료...'"
echo "pkill -f 'node.*index.js' || echo '종료할 프로세스 없음'"
echo "sleep 3"
echo "echo '🚀 새 서버 시작...'"
echo "nohup node index.js > /home/ec2-user/backend.log 2>&1 &"
echo "sleep 5"
echo "echo '📊 서버 상태 확인:'"
echo "ps aux | grep node | grep -v grep"
echo "echo '🔍 API 헬스체크:'"
echo "curl -s http://localhost:8001/api/health | jq . || curl -s http://localhost:8001/api/health"
echo "echo '✅ 백엔드 배포 완료!'"
echo "EOF"

# 4단계: 원클릭 백엔드 배포 파일 생성
echo -e "\n4️⃣ 원클릭 백엔드 배포 파일 생성..."
cat > ec2-deploy.sh << 'DEPLOY_EOF'
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
DEPLOY_EOF

chmod +x ec2-deploy.sh

echo "✅ 원클릭 배포 스크립트 생성됨: ec2-deploy.sh"

# 5단계: 배포 후 확인 사항
echo -e "\n5️⃣ 배포 완료 후 확인사항:"
echo "📋 체크리스트:"
echo "  □ 프론트엔드: https://www.minglingchat.com (1-2분 후 확인)"
echo "  □ 백엔드 API: https://api.minglingchat.com/api/health"
echo "  □ 백엔드 수동 배포: ./ec2-deploy.sh 실행"
echo "  □ 기능 테스트: 결제/캐릭터 생성 등"

echo -e "\n6️⃣ 빠른 명령어:"
echo "🔥 백엔드 즉시 배포: ./ec2-deploy.sh"
echo "🔍 API 상태 확인: curl -s https://api.minglingchat.com/api/health | jq ."
echo "📊 백엔드 로그 확인: ssh -i ~/.ssh/minglingchat.pem ec2-user@ec2-13-125-231-217.ap-northeast-2.compute.amazonaws.com 'tail -f /home/ec2-user/backend.log'"

echo -e "\n🎉 배포 프로세스 완료!"
echo "이제 백엔드를 수동으로 배포하려면 다음 중 하나를 선택하세요:"
echo "1. 원클릭: ./ec2-deploy.sh"
echo "2. 수동: 위의 SSH 명령어 복사해서 실행" 