#!/bin/bash
# EC2 포트 80 → 8001 포워딩 설정 스크립트

echo "🔧 EC2 포트 포워딩 설정 시작..."

# 1. socat 설치
echo "📦 socat 설치 중..."
sudo yum install socat -y

# 2. 기존 socat 프로세스 종료
echo "🔄 기존 프로세스 정리 중..."
sudo pkill socat 2>/dev/null || true

# 3. 포트 80이 사용 중인지 확인
if sudo netstat -tlnp | grep :80 > /dev/null; then
    echo "⚠️ 포트 80이 이미 사용 중입니다. 기존 서비스를 확인하세요."
    sudo netstat -tlnp | grep :80
fi

# 4. 포트 8001이 사용 중인지 확인
if ! sudo netstat -tlnp | grep :8001 > /dev/null; then
    echo "❌ 포트 8001에 서비스가 실행되고 있지 않습니다."
    echo "   Node.js 백엔드 서버가 실행 중인지 확인하세요."
    exit 1
fi

# 5. 시스템 서비스 생성
echo "🔧 시스템 서비스 생성 중..."
sudo tee /etc/systemd/system/port-redirect.service > /dev/null <<'EOF'
[Unit]
Description=Port 80 to 8001 redirect for API
After=network.target

[Service]
Type=simple
ExecStart=/usr/bin/socat TCP-LISTEN:80,fork TCP:localhost:8001
Restart=always
User=root
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# 6. 서비스 등록 및 시작
echo "🚀 서비스 시작 중..."
sudo systemctl daemon-reload
sudo systemctl enable port-redirect
sudo systemctl start port-redirect

# 7. 잠시 대기
sleep 2

# 8. 서비스 상태 확인
echo "📊 서비스 상태 확인..."
sudo systemctl status port-redirect --no-pager

# 9. 포트 확인
echo "🔍 포트 상태 확인..."
echo "포트 80:"
sudo netstat -tlnp | grep :80
echo "포트 8001:"
sudo netstat -tlnp | grep :8001

# 10. 테스트
echo "🧪 API 테스트 중..."
if curl -s -I http://localhost:80/api/health | head -1; then
    echo "✅ 포트 포워딩 설정 완료!"
    echo "🌐 외부에서 https://api.minglingchat.com 접속 가능"
else
    echo "❌ 테스트 실패. 설정을 확인하세요."
fi

echo "🔧 설정 완료!" 