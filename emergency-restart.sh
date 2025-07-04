#!/bin/bash

# 🚨 Mingling 서버 긴급 복구 스크립트
# EC2에서 실행: bash emergency-restart.sh

echo "🚨 긴급 서버 복구 시작..."
echo "📅 $(date)"
echo ""

# 1. 현재 상태 확인
echo "📊 현재 상태 확인:"
echo "PM2 프로세스:"
pm2 list
echo ""
echo "포트 8001 사용 상태:"
sudo netstat -tlnp | grep 8001 || echo "포트 8001 사용 안됨"
echo ""

# 2. 모든 Node.js 프로세스 강제 종료
echo "🔥 모든 Node.js 프로세스 강제 종료..."
pm2 delete all || true
pm2 kill || true
sudo pkill -f node || true
sudo pkill -f "index.js" || true

# 포트 8001을 사용하는 프로세스 강제 종료
echo "🔌 포트 8001 강제 해제..."
sudo lsof -ti:8001 | xargs sudo kill -9 || true

sleep 3

# 3. 최신 코드 적용
echo "📥 최신 코드 적용..."
cd /home/ec2-user/mingling_new
git fetch origin
git reset --hard origin/main
git clean -fd

# 4. 의존성 재설치
echo "📦 의존성 재설치..."
cd backend
npm install --production

# 5. PM2 재시작
echo "🔄 PM2 재시작..."
pm2 startup || true
pm2 save || true

# 6. 서버 시작
echo "🚀 서버 시작..."
cd /home/ec2-user/mingling_new/backend
PORT=8001 NODE_ENV=production pm2 start index.js --name "mingling-backend" --max-memory-restart 1G

# 7. 상태 확인
echo "📊 시작 후 상태 확인..."
sleep 5
pm2 status

# 8. 헬스 체크
echo "🏥 헬스 체크..."
sleep 3
echo "로컬 서버 테스트:"
curl -v http://localhost:8001/api/health || echo "❌ 로컬 서버 응답 없음"

echo ""
echo "외부 접근 테스트:"
curl -v https://api.minglingchat.com/api/health || echo "❌ 외부 접근 불가"

# 9. 로그 확인
echo ""
echo "📋 최근 로그:"
pm2 logs mingling-backend --lines 10

# 10. 최종 상태 보고
echo ""
echo "✅ 긴급 복구 완료!"
echo "📊 최종 상태:"
pm2 status
echo ""
echo "🔍 추가 확인사항:"
echo "- 포트 8001 상태: $(sudo netstat -tlnp | grep 8001 && echo '사용중' || echo '사용안됨')"
echo "- PM2 프로세스 수: $(pm2 list | grep -c online || echo '0')"
echo "- 메모리 사용량: $(free -h | grep Mem | awk '{print $3"/"$2}')"

echo ""
echo "🎯 다음 단계:"
echo "1. 브라우저에서 https://www.minglingchat.com 새로고침"
echo "2. 개발자 도구에서 네트워크 탭 확인"
echo "3. CORS 오류가 사라졌는지 확인" 