# EC2 업데이트 스크립트 생성

EC2에서 다음 명령어로 업데이트 스크립트를 생성하세요:

```bash
# 프로젝트 루트로 이동
cd /home/ec2-user/mingling_new

# 업데이트 스크립트 생성
cat > update-backend.sh << 'SCRIPT_EOF'
#!/bin/bash

# EC2 백엔드 업데이트 스크립트
echo "🚀 Mingling 백엔드 업데이트 시작..."

# 현재 디렉토리 확인
if [ ! -d "backend" ]; then
    echo "❌ 백엔드 디렉토리가 없습니다. 프로젝트 루트에서 실행하세요."
    exit 1
fi

# Git 변경사항 확인
echo "📥 Git에서 최신 코드 가져오기..."
git fetch origin

# 로컬 변경사항 처리
if ! git diff --quiet HEAD origin/main; then
    echo "📋 업데이트 가능한 변경사항이 있습니다."
    
    # 로컬 변경사항 스태시
    echo "💾 로컬 변경사항 임시 저장..."
    git stash
    
    # 최신 코드 가져오기
    git pull origin main
    
    # 스태시 적용
    echo "🔄 로컬 변경사항 복원..."
    git stash pop 2>/dev/null || echo "⚠️ 스태시 적용 실패 (충돌 가능성)"
    
    # 의존성 업데이트
    echo "📦 의존성 업데이트 확인 중..."
    cd backend
    npm install
    cd ..
    
    # PM2 재시작
    echo "🔄 백엔드 서버 재시작..."
    pm2 restart mingling-backend
    
    echo "✅ 업데이트 완료!"
    echo "📊 서버 상태:"
    pm2 status
    
    echo "🏥 Health Check:"
    sleep 2
    curl -s http://localhost:8001/api/health | jq . || curl -s http://localhost:8001/api/health
else
    echo "✅ 이미 최신 버전입니다."
fi

echo "🎯 업데이트 스크립트 완료!"
SCRIPT_EOF

# 실행 권한 부여
chmod +x update-backend.sh

echo "✅ 업데이트 스크립트가 생성되었습니다!"
echo "사용법: ./update-backend.sh"
```
