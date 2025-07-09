/**
 * 애플리케이션 상수 정의
 */

// 성별 옵션
export const GENDER_OPTIONS = [
  { value: 'male', label: '남성' },
  { value: 'female', label: '여성' },
  { value: 'undisclosed', label: '밝히지 않음' }
];

// 캐릭터 타입
export const CHARACTER_TYPES = [
  '애니메이션 & 만화 주인공',
  '개인 캐릭터', 
  '순수창작 캐릭터',
  '셀럽브리티',
  '영화 & 드라마 주인공',
  '버튜버',
  '기타'
];

// 해시태그 카테고리
export const HASHTAG_CATEGORIES = {
  성격: [
    '#친근한', '#따뜻한', '#차분한', '#활발한', 
    '#유머러스한', '#진지한', '#귀여운', '#섹시한', 
    '#지적인', '#감성적인'
  ],
  관계: [
    '#연인', '#친구', '#멘토', '#상담사',
    '#선생님', '#동료', '#가족', '#코치'
  ],
  취미: [
    '#독서', '#영화', '#음악', '#게임',
    '#운동', '#요리', '#여행', '#사진'
  ],
  직업: [
    '#의사', '#교사', '#개발자', '#배우',
    '#가수', '#요리사', '#변호사', '#아티스트',
    '#그림', '#슈퍼히어로', '#전범죄', '#진보적'
  ]
};

// 하트 패키지
export const HEART_PACKAGES = [
  { id: 'basic', hearts: 50, price: 1000, name: '기본 팩', icon: '💖' },
  { id: 'popular', hearts: 120, price: 2000, name: '인기 팩', icon: '⭐', popular: true },
  { id: 'bulk', hearts: 300, price: 4500, name: '대용량 팩', icon: '⚡', discount: '25% 할인' },
  { id: 'premium', hearts: 500, price: 7000, name: '프리미엄 팩', icon: '👑', discount: '30% 할인' }
];

// 업로드 설정
export const UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 2 * 1024 * 1024, // 2MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.webp']
};

// API 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.'
};

// 성공 메시지
export const SUCCESS_MESSAGES = {
  CHARACTER_CREATED: '캐릭터가 성공적으로 생성되었습니다!',
  CHARACTER_UPDATED: '캐릭터가 성공적으로 수정되었습니다!',
  CHARACTER_DELETED: '캐릭터가 삭제되었습니다.',
  PERSONA_CREATED: '페르소나가 성공적으로 생성되었습니다!',
  PERSONA_UPDATED: '페르소나가 성공적으로 수정되었습니다!',
  PERSONA_DELETED: '페르소나가 삭제되었습니다.',
  IMAGE_UPLOADED: '이미지가 성공적으로 업로드되었습니다!',
  HEART_PURCHASED: '하트가 성공적으로 충전되었습니다!'
};

// 로딩 메시지
export const LOADING_MESSAGES = {
  LOADING: '로딩 중...',
  UPLOADING: '업로드 중...',
  CREATING: '생성 중...',
  UPDATING: '수정 중...',
  DELETING: '삭제 중...',
  PROCESSING_PAYMENT: '결제 처리 중...',
  GENERATING_RESPONSE: 'AI 응답 생성 중...'
};

// 폼 필드 길이 제한
export const FIELD_LIMITS = {
  CHARACTER_NAME: 15,
  PERSONA_NAME: 15,
  AGE: 15,
  JOB: 15,
  LIKES_DISLIKES: 50,
  FIRST_IMPRESSION: 300,
  BASIC_SETTING: 700,
  BASIC_INFO: 500,
  HABITS: 500,
  MAX_WEAPONS: 10
};

// 캐시 설정
export const CACHE_CONFIG = {
  HEART_BALANCE_TTL: 60000, // 1분
  USER_PROFILE_TTL: 300000, // 5분
  CHARACTER_LIST_TTL: 180000 // 3분
};

// 페이지 경로
export const ROUTES = {
  HOME: '/',
  CHATS: '/chats',
  CHAT: '/chat/:chatId',
  FOR_YOU: '/for-you',
  MY_PAGE: '/my',
  CHARACTER_CREATION: '/character-creation',
  PERSONA_MANAGEMENT: '/persona-management',
  SETTINGS: '/settings'
};

// 로컬 스토리지 키
export const STORAGE_KEYS = {
  USER_ID: 'userId',
  USER_EMAIL: 'userEmail',
  AUTH_DATA: 'authData',
  HEART_BALANCE: 'heartBalance',
  API_ERROR_LOGS: 'api_error_logs'
}; 