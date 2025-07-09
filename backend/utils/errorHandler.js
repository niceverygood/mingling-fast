/**
 * 에러 핸들링 유틸리티
 */

/**
 * 사용자 친화적 에러 메시지 매핑
 */
const ERROR_MESSAGES = {
  // Prisma 에러
  P2002: '이미 존재하는 정보입니다. 다른 값을 사용해주세요.',
  P2025: '요청한 정보를 찾을 수 없습니다.',
  P2003: '관련된 정보가 존재하지 않습니다.',
  P2014: '필수 정보가 누락되었습니다.',
  
  // 일반 에러
  VALIDATION_ERROR: '입력 정보를 확인해주세요.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '권한이 없습니다.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  CONFLICT: '이미 존재하는 정보입니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  
  // 비즈니스 로직 에러
  USER_NOT_FOUND: '사용자 정보를 찾을 수 없습니다.',
  INSUFFICIENT_HEARTS: '하트가 부족합니다.',
  INVALID_FILE_TYPE: '지원하지 않는 파일 형식입니다.',
  FILE_TOO_LARGE: '파일 크기가 너무 큽니다.',
  PAYMENT_FAILED: '결제 처리에 실패했습니다.'
};

/**
 * 에러 타입 분류
 */
const getErrorType = (error) => {
  // Prisma 에러
  if (error.code && error.code.startsWith('P')) {
    return 'PRISMA_ERROR';
  }
  
  // HTTP 상태 코드 기반
  if (error.status || error.statusCode) {
    const status = error.status || error.statusCode;
    if (status >= 400 && status < 500) return 'CLIENT_ERROR';
    if (status >= 500) return 'SERVER_ERROR';
  }
  
  // 에러 메시지 기반
  if (error.message) {
    if (error.message.includes('timeout')) return 'TIMEOUT_ERROR';
    if (error.message.includes('network')) return 'NETWORK_ERROR';
    if (error.message.includes('validation')) return 'VALIDATION_ERROR';
  }
  
  return 'UNKNOWN_ERROR';
};

/**
 * HTTP 상태 코드 결정
 */
const getStatusCode = (error) => {
  // 이미 상태 코드가 있는 경우
  if (error.status) return error.status;
  if (error.statusCode) return error.statusCode;
  
  // Prisma 에러 코드 기반
  if (error.code) {
    switch (error.code) {
    case 'P2002': return 409; // Conflict
    case 'P2025': return 404; // Not Found
    case 'P2003': return 400; // Bad Request
    case 'P2014': return 400; // Bad Request
    default: return 500;
    }
  }
  
  // 에러 메시지 기반
  if (error.message) {
    if (error.message.includes('USER_NOT_FOUND')) return 404;
    if (error.message.includes('INSUFFICIENT_HEARTS')) return 400;
    if (error.message.includes('UNAUTHORIZED')) return 401;
    if (error.message.includes('FORBIDDEN')) return 403;
    if (error.message.includes('VALIDATION')) return 400;
  }
  
  return 500; // Internal Server Error
};

/**
 * 사용자 친화적 에러 메시지 생성
 */
const getUserFriendlyMessage = (error) => {
  // Prisma 에러 코드 기반
  if (error.code && ERROR_MESSAGES[error.code]) {
    return ERROR_MESSAGES[error.code];
  }
  
  // 커스텀 에러 메시지 기반
  if (error.message) {
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (error.message.includes(key)) {
        return message;
      }
    }
  }
  
  return ERROR_MESSAGES.SERVER_ERROR;
};

/**
 * 에러 로깅
 */
const logError = (error, context = {}) => {
  const errorInfo = {
    message: error.message,
    stack: error.stack,
    code: error.code,
    type: getErrorType(error),
    context,
    timestamp: new Date().toISOString()
  };
  
  console.error('❌ Error occurred:', JSON.stringify(errorInfo, null, 2));
  
  // 프로덕션 환경에서는 외부 로깅 서비스로 전송 가능
  // if (process.env.NODE_ENV === 'production') {
  //   sendToLoggingService(errorInfo);
  // }
};

/**
 * 에러 응답 생성
 */
const createErrorResponse = (error, context = {}) => {
  const statusCode = getStatusCode(error);
  const userMessage = getUserFriendlyMessage(error);
  const errorType = getErrorType(error);
  
  // 에러 로깅
  logError(error, context);
  
  const response = {
    success: false,
    error: userMessage,
    type: errorType,
    timestamp: new Date().toISOString()
  };
  
  // 개발 환경에서만 상세 정보 포함
  if (process.env.NODE_ENV === 'development') {
    response.details = {
      originalMessage: error.message,
      code: error.code,
      stack: error.stack
    };
  }
  
  return { statusCode, response };
};

/**
 * 성공 응답 생성
 */
const createSuccessResponse = (data, message = null) => {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString()
  };
};

/**
 * Express 에러 핸들러 미들웨어
 */
const errorHandlerMiddleware = (error, req, res, _next) => {
  const context = {
    method: req.method,
    url: req.url,
    userId: req.headers['x-user-id'],
    userAgent: req.headers['user-agent'],
    ip: req.ip
  };
  
  const { statusCode, response } = createErrorResponse(error, context);
  res.status(statusCode).json(response);
};

/**
 * 비동기 라우트 핸들러 래퍼
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  ERROR_MESSAGES,
  getErrorType,
  getStatusCode,
  getUserFriendlyMessage,
  logError,
  createErrorResponse,
  createSuccessResponse,
  errorHandlerMiddleware,
  asyncHandler
}; 