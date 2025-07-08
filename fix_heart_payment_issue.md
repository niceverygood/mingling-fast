# 🚨 하트 결제 시스템 문제 해결

## 🔍 문제 분석
1. **현상**: 150개 → 120개 결제 → 120개 (270개가 되어야 함)
2. **원인**: 결제는 성공했지만 하트 추가 로직에서 실패
3. **근본원인**: 사용자 정보가 데이터베이스에 없음

## 🛠️ 즉시 해결 방법

### 1단계: 사용자 생성 및 하트 수동 추가
```sql
-- EC2에서 실행
mysql -h mingling-db.cdmmsa0o2tp2.ap-northeast-2.rds.amazonaws.com -u admin -pMingle123! -e "
USE mingling_db;

-- 현재 사용자 확인
SELECT * FROM users WHERE email LIKE '%niceverygood%' OR id LIKE '%niceverygood%';

-- 사용자가 없으면 생성 (실제 User ID로 교체 필요)
INSERT INTO users (id, email, username, hearts, createdAt, updatedAt) 
VALUES (
  'USER_ID_HERE',  -- 브라우저에서 localStorage.getItem('userId') 값
  'USER_EMAIL_HERE', -- 브라우저에서 localStorage.getItem('userEmail') 값
  'USER_NAME_HERE',
  270,  -- 150 + 120 = 270
  NOW(),
  NOW()
) ON DUPLICATE KEY UPDATE hearts = 270, updatedAt = NOW();

-- 결제 기록 추가
INSERT INTO heart_transactions (
  id, userId, amount, heartAmount, type, status, 
  impUid, merchantUid, createdAt, updatedAt
) VALUES (
  CONCAT('manual_', UNIX_TIMESTAMP()),
  'USER_ID_HERE',
  2000,
  120,
  'purchase',
  'completed',
  'manual_correction',
  CONCAT('manual_', UNIX_TIMESTAMP()),
  NOW(),
  NOW()
);
"
```

### 2단계: 사용자 정보 확인 방법
**브라우저에서 다음 실행:**
```javascript
// 개발자 도구(F12) → Console에서 실행
console.log('User ID:', localStorage.getItem('userId'));
console.log('User Email:', localStorage.getItem('userEmail'));
```

### 3단계: 자동 사용자 생성 로직 수정
```javascript
// backend/routes/hearts.js에서 사용자 자동 생성 강화
const ensureUser = async (userId, userEmail) => {
  let user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    console.log('👤 사용자 자동 생성 중...', { userId, userEmail });
    user = await prisma.user.create({
      data: {
        id: userId,
        email: userEmail || `${userId}@firebase.user`,
        username: userEmail?.split('@')[0] || `user_${userId}`,
        hearts: 150 // 기본 하트
      }
    });
  }
  
  return user;
};
```

## 🔄 시스템 개선 사항

### 1. 결제 실패 시 롤백 로직 추가
```javascript
// 트랜잭션으로 원자성 보장
const result = await prisma.$transaction(async (tx) => {
  const user = await ensureUser(userId, userEmail);
  
  // 하트 추가
  const updatedUser = await tx.user.update({
    where: { id: userId },
    data: { hearts: { increment: heartAmount } }
  });
  
  // 거래 기록
  const transaction = await tx.heartTransaction.create({
    data: { /* ... */ }
  });
  
  return { user: updatedUser, transaction };
});
```

### 2. 프론트엔드 에러 처리 개선
```javascript
// frontend에서 하트 구매 후 즉시 잔액 확인
const result = await paymentService.purchaseHearts(packageId);
if (result.success) {
  // 서버에서 최신 하트 잔액 가져오기
  const balanceResponse = await heartsAPI.getBalance();
  setHearts(balanceResponse.data.hearts);
}
```

### 3. 실시간 하트 잔액 동기화
```javascript
// 결제 완료 후 즉시 하트 잔액 새로고침
const refreshHeartBalance = async () => {
  try {
    const response = await fetch('https://api.minglingchat.com/api/hearts/balance', {
      headers: {
        'X-User-ID': localStorage.getItem('userId'),
        'X-User-Email': localStorage.getItem('userEmail')
      }
    });
    const data = await response.json();
    return data.hearts;
  } catch (error) {
    console.error('하트 잔액 조회 실패:', error);
    return null;
  }
};
```

## 🧪 테스트 절차

1. **사용자 정보 확인**
2. **수동 하트 보정**
3. **새로운 결제 테스트**
4. **프론트엔드 하트 잔액 실시간 반영 확인**

## 📋 체크리스트
- [ ] 사용자 ID/Email 확인
- [ ] 데이터베이스에서 사용자 생성/수정
- [ ] 하트 잔액 수동 보정 (270개)
- [ ] 새로운 결제 테스트
- [ ] 프론트엔드 하트 표시 정상화
- [ ] 자동 사용자 생성 로직 배포 