#!/bin/bash

# 🔍 Mingling 서버 상태 체크 및 자동 복구 스크립트
# EC2에서 실행: bash check-server-status.sh

echo "🔍 Mingling 서버 상태 체크 시작..."
echo "📅 $(date)"
echo ""

# 1. PM2 프로세스 상태 확인
echo "📊 PM2 프로세스 상태:"
pm2 status

# 2. 포트 8001 사용 확인
echo ""
echo "🔌 포트 8001 상태:"
netstat -tlnp | grep 8001 || echo "❌ 포트 8001에서 실행 중인 프로세스 없음"

# 3. 서버 응답 테스트
echo ""
echo "🏥 서버 헬스 체크:"
curl -s -o /dev/null -w "HTTP 상태: %{http_code}, 응답시간: %{time_total}s\n" http://localhost:8001/api/health || echo "❌ 서버 응답 없음"

# 4. 외부 접근 테스트
echo ""
echo "🌐 외부 접근 테스트:"
curl -s -o /dev/null -w "HTTP 상태: %{http_code}, 응답시간: %{time_total}s\n" https://api.minglingchat.com/api/health || echo "❌ 외부 접근 불가"

# 5. 시스템 리소스 확인
echo ""
echo "💻 시스템 리소스:"
echo "메모리 사용량:"
free -h
echo ""
echo "디스크 사용량:"
df -h /
echo ""
echo "CPU 사용률:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 + $4}'

# 6. 로그 확인
echo ""
echo "📋 최근 에러 로그:"
pm2 logs mingling-backend --lines 5 --err || echo "❌ 로그 확인 불가"

# 7. 자동 복구 시도
echo ""
echo "🔧 자동 복구 시도..."

# PM2 프로세스가 없거나 오류 상태인 경우 재시작
if ! pm2 describe mingling-backend > /dev/null 2>&1; then
    echo "❌ PM2 프로세스 없음 - 재시작 시도"
    cd /home/ec2-user/mingling_new/backend
    PORT=8001 pm2 start index.js --name "mingling-backend"
    sleep 5
    pm2 status
elif pm2 describe mingling-backend | grep -q "errored\|stopped"; then
    echo "❌ PM2 프로세스 오류 상태 - 재시작 시도"
    pm2 restart mingling-backend
    sleep 5
    pm2 status
else
    echo "✅ PM2 프로세스 정상 상태"
fi

# 8. 재시작 후 최종 확인
echo ""
echo "🔍 최종 상태 확인:"
sleep 3
curl -s -o /dev/null -w "로컬 서버 상태: %{http_code}\n" http://localhost:8001/api/health
curl -s -o /dev/null -w "외부 접근 상태: %{http_code}\n" https://api.minglingchat.com/api/health

echo ""
echo "✅ 서버 상태 체크 완료"
echo "📊 PM2 상태:"
pm2 status 