#!/bin/bash
echo "🧪 Mingling 전체 시스템 테스트 시작..."
echo "📍 API URL: https://api.minglingchat.com"
echo "⏰ 시작 시간: $(date)"
echo ""

# 테스트 사용자 정보
TEST_USER_ID="test-deploy-$(date +%s)"
TEST_USER_EMAIL="test-deploy-$(date +%s)@minglingchat.com"

echo "👤 테스트 사용자: $TEST_USER_ID"
echo "📧 테스트 이메일: $TEST_USER_EMAIL"
echo ""

# 1. 헬스체크
echo "🏥 === 헬스체크 ==="
curl -s https://api.minglingchat.com/api/health | jq
echo ""

# 2. 사용자 프로필 생성/조회
echo "👤 === 사용자 프로필 테스트 ==="
curl -s https://api.minglingchat.com/api/users/profile \
  -H "X-User-Id: $TEST_USER_ID" \
  -H "X-User-Email: $TEST_USER_EMAIL" | jq
echo ""

# 3. 캐릭터 목록 조회
echo "🤖 === 캐릭터 목록 조회 ==="
curl -s https://api.minglingchat.com/api/characters \
  -H "X-User-Id: $TEST_USER_ID" \
  -H "X-User-Email: $TEST_USER_EMAIL" | jq ".[0:2]"
echo ""

# 4. 캐릭터 생성 테스트
echo "🎭 === 캐릭터 생성 테스트 ==="
curl -s https://api.minglingchat.com/api/characters \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $TEST_USER_ID" \
  -H "X-User-Email: $TEST_USER_EMAIL" \
  -d "{
    \"name\": \"테스트캐릭터-$(date +%s)\",
    \"description\": \"자동 테스트로 생성된 캐릭터입니다\",
    \"personality\": \"친근하고 도움이 되는 성격\",
    \"gender\": \"undisclosed\",
    \"characterType\": \"순수창작\",
    \"hashtags\": [\"테스트\", \"자동생성\"]
  }" | jq
echo ""

# 5. 페르소나 목록 조회
echo "👥 === 페르소나 목록 조회 ==="
curl -s https://api.minglingchat.com/api/personas \
  -H "X-User-Id: $TEST_USER_ID" \
  -H "X-User-Email: $TEST_USER_EMAIL" | jq
echo ""

# 6. 페르소나 생성 테스트
echo "🎨 === 페르소나 생성 테스트 ==="
curl -s https://api.minglingchat.com/api/personas \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $TEST_USER_ID" \
  -H "X-User-Email: $TEST_USER_EMAIL" \
  -d "{
    \"name\": \"테스트페르소나-$(date +%s)\",
    \"age\": \"25\",
    \"gender\": \"undisclosed\",
    \"job\": \"테스터\",
    \"basicInfo\": \"자동 테스트용 페르소나\",
    \"personality\": \"테스트를 좋아하는 성격\"
  }" | jq
echo ""

# 7. 채팅 목록 조회
echo "💬 === 채팅 목록 조회 ==="
curl -s https://api.minglingchat.com/api/chats \
  -H "X-User-Id: $TEST_USER_ID" \
  -H "X-User-Email: $TEST_USER_EMAIL" | jq
echo ""

# 8. 결제 시스템 테스트
echo "💳 === 결제 시스템 테스트 ==="
echo "결제 검증 API 테스트 (테스트 모드):"
curl -s https://api.minglingchat.com/api/payment/verify \
  -X POST \
  -H "Content-Type: application/json" \
  -H "X-User-Id: $TEST_USER_ID" \
  -H "X-User-Email: $TEST_USER_EMAIL" \
  -d "{
    \"imp_uid\": \"test_payment_$(date +%s)\",
    \"merchant_uid\": \"test_order_$(date +%s)\"
  }" | jq
echo ""

# 9. 서버 통계 확인
echo "📊 === 서버 통계 ==="
curl -s https://api.minglingchat.com/api/debug/stats | jq
echo ""

echo "✅ 전체 시스템 테스트 완료!"
echo "⏰ 완료 시간: $(date)"

