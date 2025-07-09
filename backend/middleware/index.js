/**
 * 공통 미들웨어 모음
 */

const { createErrorResponse } = require('../utils/errorHandler');

/**
 * 사용자 인증 미들웨어
 */
const authenticateUser = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  const userEmail = req.headers['x-user-email'];
  
  if (!userId) {
    const { statusCode, response } = createErrorResponse(
      new Error('UNAUTHORIZED'),
      { url: req.url, method: req.method }
    );
    return res.status(statusCode).json(response);
  }
  
  // 사용자 정보를 req에 추가
  req.user = {
    id: userId,
    email: userEmail
  };
  
  next();
};

/**
 * 요청 로깅 미들웨어
 */
const logRequest = (req, res, next) => {
  const startTime = Date.now();
  
  console.log(`📨 ${req.method} ${req.url} - User: ${req.headers['x-user-id'] || 'Anonymous'}`);
  
  // 응답 완료 시 로깅
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusIcon = res.statusCode < 400 ? '✅' : '❌';
    console.log(`${statusIcon} ${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  
  next();
};

/**
 * CORS 미들웨어
 */
const corsMiddleware = (req, res, next) => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID, X-User-Email');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  next();
};

/**
 * 요청 바디 크기 제한 미들웨어
 */
const limitRequestSize = (limit = '2mb') => {
  return (req, res, next) => {
    const contentLength = req.headers['content-length'];
    
    if (contentLength && parseInt(contentLength) > parseSize(limit)) {
      const { statusCode, response } = createErrorResponse(
        new Error('FILE_TOO_LARGE'),
        { url: req.url, method: req.method, size: contentLength }
      );
      return res.status(statusCode).json(response);
    }
    
    next();
  };
};

/**
 * 파일 크기를 바이트로 변환
 */
const parseSize = (size) => {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toLowerCase().match(/^(\d+(?:\.\d+)?)(b|kb|mb|gb)$/);
  
  if (!match) return 0;
  
  return parseFloat(match[1]) * units[match[2]];
};

/**
 * 속도 제한 미들웨어 (간단한 구현)
 */
const rateLimitMiddleware = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    
    if (!requests.has(key)) {
      requests.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    const record = requests.get(key);
    
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }
    
    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        resetTime: record.resetTime
      });
    }
    
    record.count++;
    next();
  };
};

/**
 * 헬스체크 미들웨어
 */
const healthCheck = (req, res, next) => {
  if (req.path === '/api/health') {
    return res.json({
      success: true,
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  }
  next();
};

/**
 * 정적 파일 보안 미들웨어
 */
const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
};

module.exports = {
  authenticateUser,
  logRequest,
  corsMiddleware,
  limitRequestSize,
  rateLimitMiddleware,
  healthCheck,
  securityHeaders
}; 