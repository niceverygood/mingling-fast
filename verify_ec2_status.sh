#!/bin/bash

echo "🔍 EC2 서버 상태 정밀 진단..."

echo "1. PM2 프로세스 상태:"
pm2 status

echo ""
echo "2. 현재 실행 중인 Node.js 프로세스:"
ps aux | grep node

echo ""
echo "3. 포트 8001 사용 현황:"
netstat -tlnp | grep 8001

echo ""
echo "4. 로컬 헬스체크 (직접 포트 8001):"
curl -s localhost:8001/api/health | jq .

echo ""
echo "5. 로컬 결제 API 테스트:"
curl -s localhost:8001/api/payment/verify -X POST -H "Content-Type: application/json" -d '{}' | jq .

echo ""
echo "6. 현재 코드 버전 (package.json):"
cat /home/ec2-user/mingling_new/backend/package.json | grep version

echo ""
echo "7. Git 상태:"
cd /home/ec2-user/mingling_new
git log --oneline -5

echo ""
echo "8. 서버 실행 로그 (최근 20줄):"
pm2 logs mingling-backend --lines 20

echo ""
echo "9. 시스템 리소스 상태:"
free -h
df -h

echo ""
echo "✅ 진단 완료" 