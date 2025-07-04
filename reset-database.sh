#!/bin/bash

# 🗑️ Mingling RDS 데이터베이스 초기화 스크립트
# 사용법: bash reset-database.sh

echo "🗑️ Mingling RDS 데이터베이스 초기화 시작..."
echo "⚠️  경고: 이 작업은 모든 데이터를 영구적으로 삭제합니다!"
echo ""

# RDS 연결 정보
DB_HOST="mingling-db.cdmmsa0o2tp2.ap-northeast-2.rds.amazonaws.com"
DB_USER="admin"
DB_PASSWORD="Mingle123!"
DB_NAME="mingling_db"

echo "📊 삭제 전 데이터 현황 확인..."
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'characters', COUNT(*) FROM characters
UNION ALL
SELECT 'personas', COUNT(*) FROM personas
UNION ALL
SELECT 'chats', COUNT(*) FROM chats
UNION ALL
SELECT 'messages', COUNT(*) FROM messages
UNION ALL
SELECT 'heart_transactions', COUNT(*) FROM heart_transactions;
"

echo ""
echo "🔥 5초 후 데이터 삭제를 시작합니다..."
echo "❌ 중단하려면 Ctrl+C를 누르세요!"
sleep 5

echo ""
echo "🗑️ 데이터 삭제 중..."

# SQL 스크립트 실행
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME < clear-database.sql

if [ $? -eq 0 ]; then
    echo "✅ 데이터베이스 초기화 완료!"
    echo ""
    echo "📊 삭제 후 데이터 현황:"
    mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME -e "
    SELECT 'users' as table_name, COUNT(*) as row_count FROM users
    UNION ALL
    SELECT 'characters', COUNT(*) FROM characters
    UNION ALL
    SELECT 'personas', COUNT(*) FROM personas
    UNION ALL
    SELECT 'chats', COUNT(*) FROM chats
    UNION ALL
    SELECT 'messages', COUNT(*) FROM messages
    UNION ALL
    SELECT 'heart_transactions', COUNT(*) FROM heart_transactions;
    "
    
    echo ""
    echo "🎯 다음 단계:"
    echo "1. 서버 재시작: pm2 restart all"
    echo "2. 브라우저에서 새로고침"
    echo "3. 새로운 사용자로 테스트"
else
    echo "❌ 데이터베이스 초기화 실패!"
    echo "연결 정보를 확인해주세요."
fi 