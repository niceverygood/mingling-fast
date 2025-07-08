#!/bin/bash

# S3 버킷명 수정 스크립트 - 실제 버킷명: mingling-new
# AWS 콘솔에서 실행

echo "🔧 S3 버킷명 수정 중..."

# 1단계: 백엔드 디렉토리 이동
cd /home/ec2-user/mingling_new/backend

# 2단계: 현재 환경변수 확인
echo "📋 현재 환경변수:"
printenv | grep AWS

# 3단계: 올바른 S3 버킷명으로 환경변수 수정
echo "🔧 환경변수 수정 중..."

# 실제 버킷명으로 설정
export AWS_S3_BUCKET_NAME="mingling-new"
export AWS_BUCKET="mingling-new"

# 4단계: .env 파일도 수정
echo "📝 .env 파일 수정 중..."
if [ -f .env ]; then
    # 기존 AWS_BUCKET 라인 제거
    sed -i '/AWS_BUCKET=/d' .env
    sed -i '/AWS_S3_BUCKET_NAME=/d' .env
    
    # 새로운 버킷명 추가
    echo "AWS_S3_BUCKET_NAME=\"mingling-new\"" >> .env
    echo "AWS_BUCKET=\"mingling-new\"" >> .env
    
    echo "✅ .env 파일 수정 완료"
else
    echo "⚠️ .env 파일이 없습니다. 환경변수만 설정됩니다."
fi

# 5단계: 서버 재시작
echo "🔄 서버 재시작 중..."
pkill -f 'node.*index.js'
sleep 3
nohup node index.js > /home/ec2-user/backend.log 2>&1 &
sleep 5

# 6단계: 서버 상태 확인
echo "🔍 서버 상태 확인 중..."
ps aux | grep node | grep -v grep

# 7단계: 환경변수 확인
echo "📋 수정된 환경변수:"
curl -s http://localhost:8001/api/deploy/validate | grep -A 5 '"aws"'

# 8단계: 이미지 업로드 테스트
echo "🧪 이미지 업로드 테스트 중..."
curl -X POST http://localhost:8001/api/upload/character-avatar \
  -F "avatar=@/dev/null" \
  -H "X-User-Email: test@example.com" \
  -H "X-User-Id: test123" \
  -w "\nHTTP Status: %{http_code}\n"

echo "✅ S3 버킷명 수정 완료!"
echo "🎯 새 버킷명: mingling-new" 