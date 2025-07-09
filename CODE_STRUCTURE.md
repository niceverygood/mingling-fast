# 🏗️ 코드 구조 문서

## 📁 프로젝트 구조

```
mingling_new/
├── frontend/
│   ├── src/
│   │   ├── components/           # 재사용 가능한 컴포넌트
│   │   ├── pages/               # 페이지 컴포넌트
│   │   ├── hooks/               # 커스텀 훅 (NEW)
│   │   ├── services/            # API 서비스
│   │   ├── utils/               # 유틸리티 함수 (NEW)
│   │   ├── constants/           # 상수 정의 (NEW)
│   │   ├── config/              # 설정 파일
│   │   ├── context/             # React Context
│   │   └── types/               # TypeScript 타입 정의
│   └── ...
├── backend/
│   ├── routes/                  # API 라우트
│   ├── utils/                   # 유틸리티 함수 (NEW)
│   ├── middleware/              # 미들웨어 (NEW)
│   ├── constants/               # 상수 정의 (NEW)
│   ├── services/                # 비즈니스 로직
│   ├── config/                  # 설정 파일
│   └── prisma/                  # 데이터베이스 스키마
└── ...
```

## 🎯 리팩토링 목표

1. **코드 재사용성 향상**
2. **유지보수성 개선**
3. **타입 안정성 강화**
4. **에러 핸들링 표준화**
5. **성능 최적화**

## 📱 프론트엔드 구조

### 🪝 커스텀 훅 (`frontend/src/hooks/`)

#### `useApi.js`
```javascript
// API 호출을 위한 공통 훅
export const useApi = (apiFunction, options = {}) => {
  // 로딩, 에러, 데이터 상태 관리
  // 성공/에러 콜백 지원
  // 자동 재시도 로직
};

// 하트 관련 API 훅
export const useHeartApi = () => {
  // 하트 잔액 캐싱
  // 실시간 업데이트
};

// 폼 상태 관리 훅
export const useForm = (initialValues, validationRules = {}) => {
  // 폼 상태 관리
  // 실시간 유효성 검사
  // 터치 상태 추적
};
```

**사용 예시:**
```javascript
const { data: characters, loading, error, execute } = useApi(charactersAPI.getAll);
const { values, errors, setValue, validate } = useForm(initialValues, validationRules);
```

### 🛠️ 유틸리티 함수 (`frontend/src/utils/`)

#### `validation.js`
```javascript
// 재사용 가능한 검증 함수들
export const required = (message) => (value) => { /* ... */ };
export const maxLength = (max, message) => (value) => { /* ... */ };
export const email = (message) => (value) => { /* ... */ };

// 조합 가능한 검증 규칙
export const combine = (...validators) => (value) => { /* ... */ };

// 미리 정의된 검증 규칙
export const characterValidationRules = {
  name: combine(required('이름 필수'), maxLength(15, '15자 이하')),
  // ...
};
```

**사용 예시:**
```javascript
const { values, errors, validate } = useForm(initialValues, characterValidationRules);
```

### 📊 상수 정의 (`frontend/src/constants/`)

#### `index.js`
```javascript
// 성별 옵션
export const GENDER_OPTIONS = [
  { value: 'male', label: '남성' },
  // ...
];

// 하트 패키지
export const HEART_PACKAGES = [
  { id: 'basic', hearts: 50, price: 1000, name: '기본 팩' },
  // ...
];

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  // ...
};
```

**장점:**
- 중앙 집중식 상수 관리
- 타입 안정성 향상
- 일관된 메시지 표시

## 🔧 백엔드 구조

### 🛠️ 유틸리티 함수 (`backend/utils/`)

#### `validation.js`
```javascript
// 데이터 검증 함수들
export const validateRequired = (fields, data) => { /* ... */ };
export const validateLength = (field, value, min, max) => { /* ... */ };
export const validateCharacterData = (data) => { /* ... */ };
```

#### `errorHandler.js`
```javascript
// 통합 에러 처리 시스템
export const createErrorResponse = (error, context) => {
  // 사용자 친화적 메시지 생성
  // 개발/프로덕션 환경별 처리
  // 자동 로깅
};

export const asyncHandler = (fn) => {
  // 비동기 에러 자동 처리
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

#### `database.js`
```javascript
// 데이터베이스 헬퍼 함수들
export const ensureUserExists = async (userId, email) => { /* ... */ };
export const updateHeartBalance = async (userId, amount, description) => { /* ... */ };
export const getPaginationParams = (page, limit) => { /* ... */ };
```

**사용 예시:**
```javascript
// 라우터에서 사용
router.post('/characters', asyncHandler(async (req, res) => {
  const user = await ensureUserExists(req.user.id, req.user.email);
  const validationErrors = validateCharacterData(req.body);
  if (validationErrors) {
    throw new Error('VALIDATION_ERROR');
  }
  // ...
}));
```

### 🔀 미들웨어 (`backend/middleware/`)

#### `index.js`
```javascript
// 인증 미들웨어
export const authenticateUser = (req, res, next) => {
  // 사용자 ID 검증
  // req.user 객체 생성
};

// 요청 로깅
export const logRequest = (req, res, next) => {
  // 요청/응답 시간 측정
  // 성능 모니터링
};

// 속도 제한
export const rateLimitMiddleware = (maxRequests, windowMs) => {
  // 메모리 기반 속도 제한
  // IP별 요청 횟수 추적
};
```

### 📊 상수 정의 (`backend/constants/`)

#### `index.js`
```javascript
// HTTP 상태 코드
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  // ...
};

// 하트 관련 설정
export const HEART_CONFIG = {
  DEFAULT_HEARTS: 100,
  MESSAGE_COST: 1,
  MAX_HEARTS: 10000,
  // ...
};

// 에러 코드
export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  INSUFFICIENT_HEARTS: 'INSUFFICIENT_HEARTS',
  // ...
};
```

## 🚀 성능 최적화

### 📱 프론트엔드 최적화

1. **API 호출 최적화**
   - 재시도 로직 (3회)
   - 타임아웃 설정 (15초)
   - 캐싱 시스템 (하트 잔액 1분)

2. **메모리 최적화**
   - useCallback, useMemo 적절히 사용
   - 이벤트 리스너 정리
   - 메모리 누수 방지

3. **네트워크 최적화**
   - 병렬 API 호출
   - 중복 요청 방지
   - 적절한 로딩 상태 관리

### 🔧 백엔드 최적화

1. **데이터베이스 최적화**
   - 트랜잭션 사용
   - 인덱스 활용
   - 쿼리 최적화

2. **메모리 관리**
   - 연결 풀 사용
   - 가비지 컬렉션 최적화
   - 메모리 누수 방지

3. **보안 강화**
   - 입력 데이터 검증
   - SQL 인젝션 방지
   - 속도 제한 적용

## 📈 모니터링 및 로깅

### 🔍 로깅 시스템

```javascript
// 구조화된 로깅
const logError = (error, context) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  };
  console.error('❌ Error:', JSON.stringify(errorInfo, null, 2));
};

// 성능 모니터링
const logRequest = (req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    console.log(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
};
```

### 📊 헬스 체크

```javascript
// 시스템 상태 모니터링
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});
```

## 🧪 테스트 전략

### 단위 테스트
- 유틸리티 함수 테스트
- 검증 로직 테스트
- API 함수 테스트

### 통합 테스트
- API 엔드포인트 테스트
- 데이터베이스 상호작용 테스트
- 에러 처리 테스트

### E2E 테스트
- 사용자 플로우 테스트
- 결제 시스템 테스트
- 채팅 시스템 테스트

## 🚀 배포 전략

### 프론트엔드 (Vercel)
```bash
# 자동 배포
./deploy.sh "커밋 메시지"
```

### 백엔드 (EC2)
```bash
# 수동 배포
./ec2-deploy.sh
```

### 배포 확인
```bash
# 헬스 체크
curl -s https://api.minglingchat.com/api/health | jq .

# 시스템 상태
curl -s https://api.minglingchat.com/api/stats | jq .
```

## 🎯 다음 단계

1. **테스트 커버리지 향상**
2. **CI/CD 파이프라인 구축**
3. **모니터링 시스템 강화**
4. **성능 최적화 지속**
5. **보안 강화**

---

이 문서는 리팩토링된 코드 구조를 기반으로 작성되었으며, 지속적으로 업데이트됩니다. 