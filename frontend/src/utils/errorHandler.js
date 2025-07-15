/**
 * 공통 에러 핸들링 유틸리티
 * 사용자 친화적 에러 메시지와 재시도 로직 제공
 */

// 에러 타입별 사용자 친화적 메시지
const ERROR_MESSAGES = {
  // 네트워크 에러
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  TIMEOUT_ERROR: '요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
  
  // 인증 에러
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  TOKEN_EXPIRED: '로그인이 만료되었습니다. 다시 로그인해주세요.',
  
  // 클라이언트 에러
  BAD_REQUEST: '요청 정보를 확인해주세요.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  VALIDATION_ERROR: '입력 정보를 다시 확인해주세요.',
  
  // 서버 에러
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  SERVICE_UNAVAILABLE: '서비스가 일시적으로 중단되었습니다. 잠시 후 다시 시도해주세요.',
  
  // 특정 기능 에러
  INSUFFICIENT_HEARTS: '하트가 부족합니다. 하트샵에서 충전해주세요.',
  UPLOAD_ERROR: '파일 업로드에 실패했습니다. 파일 크기와 형식을 확인해주세요.',
  PAYMENT_ERROR: '결제 처리 중 오류가 발생했습니다. 다시 시도해주세요.',
  
  // 기본 에러
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
};

// 에러 분류 함수
export const classifyError = (error) => {
  // 네트워크 에러
  if (!error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return 'TIMEOUT_ERROR';
    }
    return 'NETWORK_ERROR';
  }
  
  const status = error.response.status;
  const data = error.response.data;
  
  // HTTP 상태 코드별 분류
  switch (status) {
    case 400:
      if (data?.error?.includes('validation')) return 'VALIDATION_ERROR';
      if (data?.error?.includes('hearts')) return 'INSUFFICIENT_HEARTS';
      return 'BAD_REQUEST';
      
    case 401:
      if (data?.error?.includes('expired')) return 'TOKEN_EXPIRED';
      return 'UNAUTHORIZED';
      
    case 403:
      return 'FORBIDDEN';
      
    case 404:
      return 'NOT_FOUND';
      
    case 413:
      return 'UPLOAD_ERROR';
      
    case 422:
      return 'VALIDATION_ERROR';
      
    case 429:
      return 'TOO_MANY_REQUESTS';
      
    case 500:
    case 502:
    case 503:
      return 'SERVER_ERROR';
      
    case 503:
      return 'SERVICE_UNAVAILABLE';
      
    default:
      return 'UNKNOWN_ERROR';
  }
};

// 사용자 친화적 에러 메시지 가져오기
export const getUserFriendlyMessage = (error) => {
  const errorType = classifyError(error);
  
  // 서버에서 제공하는 사용자 친화적 메시지가 있으면 우선 사용
  if (error.response?.data?.userMessage) {
    return error.response.data.userMessage;
  }
  
  // 특정 에러에 대한 상세 메시지
  if (error.response?.data?.error) {
    const serverError = error.response.data.error;
    
    // 하트 관련 에러
    if (serverError.includes('Insufficient hearts')) {
      return ERROR_MESSAGES.INSUFFICIENT_HEARTS;
    }
    
    // 파일 업로드 에러
    if (serverError.includes('File too large') || serverError.includes('Invalid file type')) {
      return ERROR_MESSAGES.UPLOAD_ERROR;
    }
    
    // 결제 에러
    if (serverError.includes('payment') || serverError.includes('결제')) {
      return ERROR_MESSAGES.PAYMENT_ERROR;
    }
  }
  
  return ERROR_MESSAGES[errorType] || ERROR_MESSAGES.UNKNOWN_ERROR;
};

// 재시도 가능한 에러인지 확인
export const isRetryableError = (error) => {
  const errorType = classifyError(error);
  
  const retryableErrors = [
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
    'SERVER_ERROR',
    'SERVICE_UNAVAILABLE'
  ];
  
  return retryableErrors.includes(errorType);
};

// 재시도 로직이 포함된 API 호출 함수
export const withRetry = async (apiCall, options = {}) => {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    backoffMultiplier = 2,
    onRetry = null
  } = options;
  
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // 재시도 불가능한 에러인 경우 즉시 실패
      if (!isRetryableError(error) || attempt === maxRetries) {
        throw error;
      }
      
      // 재시도 콜백 실행
      if (onRetry) {
        onRetry(attempt, error);
      }
      
      // 지수 백오프로 대기
      const delay = retryDelay * Math.pow(backoffMultiplier, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      console.log(`🔄 API 재시도 ${attempt}/${maxRetries - 1} (${delay}ms 후)`);
    }
  }
  
  throw lastError;
};

// 오프라인 상태 감지
export const isOnline = () => {
  return navigator.onLine;
};

// 오프라인 에러 처리
export const handleOfflineError = () => {
  if (!isOnline()) {
    return '인터넷 연결을 확인해주세요.';
  }
  return null;
};

// 에러 보고 함수 (선택적)
export const reportError = (error, context = {}) => {
  // 개발 환경에서만 상세 로그
  if (process.env.NODE_ENV === 'development') {
    console.group('🚨 Error Report');
    console.error('Error:', error);
    console.log('Context:', context);
    console.log('Stack:', error.stack);
    console.groupEnd();
  }
  
  // 프로덕션에서는 에러 추적 서비스로 전송 (예: Sentry)
  if (process.env.NODE_ENV === 'production' && window.Sentry) {
    window.Sentry.captureException(error, {
      tags: {
        component: context.component,
        action: context.action
      },
      extra: context
    });
  }
};

// 통합 에러 핸들러
export const handleError = (error, options = {}) => {
  const {
    showToUser = true,
    logError = true,
    context = {},
    onError = null
  } = options;
  
  // 오프라인 체크
  const offlineMessage = handleOfflineError();
  if (offlineMessage) {
    return offlineMessage;
  }
  
  // 에러 로깅
  if (logError) {
    reportError(error, context);
  }
  
  // 사용자 친화적 메시지 생성
  const userMessage = getUserFriendlyMessage(error);
  
  // 커스텀 에러 핸들러 실행
  if (onError) {
    onError(error, userMessage);
  }
  
  // 사용자에게 표시할 메시지 반환
  return showToUser ? userMessage : null;
};

export default {
  classifyError,
  getUserFriendlyMessage,
  isRetryableError,
  withRetry,
  isOnline,
  handleOfflineError,
  reportError,
  handleError
}; 