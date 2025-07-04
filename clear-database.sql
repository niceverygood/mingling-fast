-- 🗑️ Mingling RDS 데이터베이스 전체 데이터 삭제 스크립트
-- 주의: 이 스크립트는 모든 데이터를 영구적으로 삭제합니다!

-- 외래 키 제약 조건 비활성화
SET FOREIGN_KEY_CHECKS = 0;

-- 1. 메시지 테이블 데이터 삭제 (가장 하위 테이블부터)
DELETE FROM messages;
ALTER TABLE messages AUTO_INCREMENT = 1;

-- 2. 채팅 테이블 데이터 삭제
DELETE FROM chats;
ALTER TABLE chats AUTO_INCREMENT = 1;

-- 3. 하트 거래 테이블 데이터 삭제
DELETE FROM heart_transactions;
ALTER TABLE heart_transactions AUTO_INCREMENT = 1;

-- 4. 캐릭터 테이블 데이터 삭제
DELETE FROM characters;
ALTER TABLE characters AUTO_INCREMENT = 1;

-- 5. 페르소나 테이블 데이터 삭제
DELETE FROM personas;
ALTER TABLE personas AUTO_INCREMENT = 1;

-- 6. 사용자 테이블 데이터 삭제 (최상위 테이블)
DELETE FROM users;
ALTER TABLE users AUTO_INCREMENT = 1;

-- 외래 키 제약 조건 재활성화
SET FOREIGN_KEY_CHECKS = 1;

-- 결과 확인
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