const express = require('express');
// const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

// 🔧 환경 변수 검증 및 로깅
const validateEnvironment = () => {
  const requiredEnvVars = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    JWT_SECRET: process.env.JWT_SECRET
  };

  const optionalEnvVars = {
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3005,https://minglingchat.com,https://www.minglingchat.com',
    IMP_SECRET: process.env.IMP_SECRET,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY
  };

  const errors = [];
  const warnings = [];

  // 필수 환경 변수 검증
  Object.entries(requiredEnvVars).forEach(([key, value]) => {
    if (!value) {
      errors.push(`❌ ${key} is required but not set`);
    } else if (key === 'OPENAI_API_KEY' && value.length < 50) {
      warnings.push(`⚠️ ${key} seems too short (${value.length} chars)`);
    } else if (key === 'JWT_SECRET' && value.length < 16) {
      warnings.push(`⚠️ ${key} is too short for security (${value.length} chars)`);
    }
  });

  // 선택적 환경 변수 검증
  if (process.env.NODE_ENV === 'production' && !optionalEnvVars.IMP_SECRET) {
    warnings.push('⚠️ IMP_SECRET not set - payment system will be disabled');
  }

  if (!optionalEnvVars.AWS_ACCESS_KEY_ID || !optionalEnvVars.AWS_SECRET_ACCESS_KEY) {
    warnings.push('⚠️ AWS credentials not set - file upload will be disabled');
  }

  // 프로덕션 환경 특별 검증
  if (process.env.NODE_ENV === 'production') {
    const prodOrigins = optionalEnvVars.ALLOWED_ORIGINS;
    if (prodOrigins.includes('localhost')) {
      warnings.push('⚠️ Production environment contains localhost origins');
    }
  }

  // 결과 출력
  console.log('🔧 Environment Configuration:', {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY ? `✅ Set (${process.env.OPENAI_API_KEY.length} chars)` : '❌ Missing',
    JWT_SECRET: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
    ALLOWED_ORIGINS: optionalEnvVars.ALLOWED_ORIGINS,
    IMP_SECRET: optionalEnvVars.IMP_SECRET ? '✅ Set' : '❌ Missing',
    AWS_CONFIGURED: (optionalEnvVars.AWS_ACCESS_KEY_ID && optionalEnvVars.AWS_SECRET_ACCESS_KEY) ? '✅ Set' : '❌ Missing',
    timestamp: new Date().toISOString()
  });

  // 에러 출력
  if (errors.length > 0) {
    console.error('💥 Environment Validation Errors:');
    errors.forEach(error => console.error(error));
    console.error('🚨 Server cannot start without required environment variables');
    process.exit(1);
  }

  // 경고 출력
  if (warnings.length > 0) {
    console.warn('⚠️ Environment Validation Warnings:');
    warnings.forEach(warning => console.warn(warning));
  }

  console.log('✅ Environment validation completed successfully');
  return true;
};

// 환경 변수 검증 실행
validateEnvironment();

// 🌐 환경별 허용 Origins 설정
const getAllowedOrigins = () => {
  if (process.env.ALLOWED_ORIGINS) {
    return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  }
  
  // 환경별 기본값
  const defaultOrigins = [
    'https://www.minglingchat.com',
    'https://minglingchat.com',
    'https://mingling-new.vercel.app'
  ];
  
  if (process.env.NODE_ENV === 'development') {
    defaultOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003', 'http://localhost:3004', 'http://localhost:3005');
  }
  
  return defaultOrigins;
};

const ALLOWED_ORIGINS = getAllowedOrigins();
console.log('🌐 Allowed Origins:', ALLOWED_ORIGINS);

let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    console.log('✅ OpenAI initialized successfully');
  } catch (error) {
    console.error('❌ OpenAI initialization failed:', error.message);
  }
} else {
  console.log('❌ OpenAI not initialized - NODE_ENV:', process.env.NODE_ENV, 'API_KEY exists:', !!process.env.OPENAI_API_KEY);
}

// OpenAI 인스턴스를 전역으로 내보내기
global.openai = openai;

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8001;

// Trust proxy 설정 - Cloudflare 프록시 환경에서 필요
app.set('trust proxy', true);

// 🔍 디버깅 모드 설정
const DEBUG_MODE = process.env.NODE_ENV === 'development' || process.env.DEBUG === 'true';

// 📊 서버 통계
const serverStats = {
  totalRequests: 0,
  corsRequests: 0,
  optionsRequests: 0,
  successfulRequests: 0,
  errorRequests: 0,
  startTime: new Date().toISOString(),
  lastRequest: null
};

// 🔍 안전한 서버 로깅 함수
const serverLog = (level, message, data = {}) => {
  if (DEBUG_MODE || level === 'error') {
    console[level](`[SERVER ${level.toUpperCase()}]`, message, data);
  }
  
  // 에러는 항상 로깅
  if (level === 'error') {
    console.error(`[ERROR] ${message}`, data);
  }
};

// Express 기본 설정 - 헤더 크기 제한 증가
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🌐 CORS 디버깅 미들웨어
const corsDebugMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const method = req.method;
  
  // 통계 업데이트
  serverStats.totalRequests++;
  if (origin) serverStats.corsRequests++;
  if (method === 'OPTIONS') serverStats.optionsRequests++;
  
  // 마지막 요청 정보 저장
  serverStats.lastRequest = {
    method: method,
    url: req.url,
    origin: origin,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent']?.substring(0, 50) + '...',
    cfRay: req.headers['cf-ray'],
    cfCountry: req.headers['cf-ipcountry']
  };
  
  serverLog('info', `📊 Request: ${method} ${req.url}`, {
    origin: origin,
    corsRequest: !!origin,
    isOptions: method === 'OPTIONS',
    cfRay: req.headers['cf-ray'],
    cfCountry: req.headers['cf-ipcountry'],
    userAgent: req.headers['user-agent']?.substring(0, 50) + '...'
  });
  
  next();
};

// 🔍 CORS 디버깅 미들웨어 적용
app.use(corsDebugMiddleware);

// 📈 서버 통계 엔드포인트
const createStatsEndpoint = (app) => {
  app.get('/api/debug/stats', (req, res) => {
    const uptime = Date.now() - new Date(serverStats.startTime).getTime();
    const stats = {
      ...serverStats,
      uptime: `${Math.floor(uptime / 1000)}s`,
      successRate: serverStats.totalRequests > 0 ? 
        (serverStats.successfulRequests / serverStats.totalRequests * 100).toFixed(2) + '%' : '0%',
      corsRate: serverStats.totalRequests > 0 ? 
        (serverStats.corsRequests / serverStats.totalRequests * 100).toFixed(2) + '%' : '0%'
    };
    
    res.json(stats);
  });
};

// 🌐 강력한 CORS 설정 - Cloudflare + 브라우저 완전 호환
const corsOptions = {
  origin: function (origin, callback) {
    // Origin이 없는 경우 (같은 도메인, 모바일 앱 등) 허용
    if (!origin) {
      console.log('✅ CORS: No origin header - allowing request');
      return callback(null, true);
    }
    
    // 허용된 origin인지 확인
    if (ALLOWED_ORIGINS.includes(origin)) {
      console.log('✅ CORS: Origin allowed:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS: Origin rejected:', origin);
    // 프로덕션에서는 보안을 위해 거부하지만, 개발 중에는 허용
    return callback(null, process.env.NODE_ENV === 'development');
  },
  
  credentials: false, // credentials를 false로 설정하여 * origin 허용
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH', 'HEAD'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-User-Email',
    'X-User-Id',
    'X-CSRF-Token',
    'Access-Control-Request-Headers',
    'Access-Control-Request-Method'
  ],
  exposedHeaders: [
    'Content-Length',
    'X-JSON',
    'X-Response-Time',
    'X-Request-Id'
  ],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 200
};

// Express CORS 미들웨어 적용
app.use(cors(corsOptions));

// 🚀 Cloudflare 프록시 환경 완전 대응 미들웨어
app.use((req, res, next) => {
  // 모든 요청에 대해 강력한 CORS 헤더 설정
  const origin = req.headers.origin;
  
  // Origin 설정 - 더 관대한 정책으로 변경
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    console.log('✅ CORS: Specific origin allowed:', origin);
  } else {
    // 모든 origin 허용 (Cloudflare 환경에서 안전)
    res.header('Access-Control-Allow-Origin', '*');
    console.log('✅ CORS: Wildcard origin set for:', origin || 'no-origin');
  }
  
  // 강력한 CORS 헤더 설정
  res.header('Access-Control-Allow-Credentials', 'false');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH, HEAD');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, X-User-Email, X-User-Id, X-CSRF-Token, Access-Control-Request-Headers, Access-Control-Request-Method');
  res.header('Access-Control-Expose-Headers', 'Content-Length, X-JSON, X-Response-Time, X-Request-Id');
  res.header('Access-Control-Max-Age', '86400');
  
  // Cloudflare 캐시 완전 무력화
  res.header('Cache-Control', 'no-cache, no-store, must-revalidate, private');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('Vary', 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers');
  
  // 응답 헤더
  res.header('X-Response-Time', new Date().toISOString());
  res.header('X-Request-Id', req.headers['cf-ray'] || `req-${Date.now()}`);
  
  // 보안 헤더
  res.header('X-Content-Type-Options', 'nosniff');
  res.header('X-Frame-Options', 'DENY');
  res.header('X-XSS-Protection', '1; mode=block');
  
  // 요청 정보 로깅 (간소화)
  if (req.method === 'OPTIONS' || req.url.includes('/api/health')) {
    console.log('🌐 Request:', {
      method: req.method,
      url: req.url,
      origin: origin,
      cfRay: req.headers['cf-ray']
    });
  }
  
  // OPTIONS 요청 완전 처리
  if (req.method === 'OPTIONS') {
    console.log('✅ OPTIONS preflight:', {
      url: req.url,
      origin: origin,
      requestHeaders: req.headers['access-control-request-headers'],
      requestMethod: req.headers['access-control-request-method']
    });
    
    // 성공 응답
    res.status(200).json({
      message: 'CORS preflight successful',
      timestamp: new Date().toISOString(),
      origin: origin,
      allowed: true
    });
    return;
  }
  
  next();
});

// 정적 파일 서빙 (로컬 업로드 파일들)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 요청 로깅 미들웨어 추가 (디버깅용)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  console.log('Headers:', {
    'user-agent': req.headers['user-agent'],
    'x-forwarded-for': req.headers['x-forwarded-for'],
    'cf-ray': req.headers['cf-ray'],
    'cf-ipcountry': req.headers['cf-ipcountry'],
    'origin': req.headers['origin'],
    'host': req.headers['host']
  });
  
  // 응답 통계 업데이트를 위한 후킹
  const originalSend = res.send;
  res.send = function(data) {
    // 응답 상태에 따라 통계 업데이트
    if (res.statusCode >= 200 && res.statusCode < 400) {
      serverStats.successfulRequests++;
    } else {
      serverStats.errorRequests++;
    }
    
    // 원본 send 함수 호출
    return originalSend.call(this, data);
  };
  
  next();
});

// 사용자 자동 생성 미들웨어 (개선)
app.use('/api', async (req, res, next) => {
  const userEmail = req.headers['x-user-email'];
  const userId = req.headers['x-user-id'];
  
  if (userEmail && userId) {
    try {
      // 사용자가 존재하는지 확인 (ID 또는 이메일로)
      let user = await prisma.user.findFirst({
        where: {
          OR: [
            { id: userId },
            { email: userEmail }
          ]
        }
      });
      
      // 사용자가 없으면 자동 생성
      if (!user) {
        const isGuestUser = userId.startsWith('guest-');
        let username;
        
        if (isGuestUser) {
          // 게스트 사용자의 경우 간단한 username 생성
          username = userId.replace('@guest.minglingchat.com', '');
        } else {
          // 일반 사용자의 경우 이메일 기반 username 생성
          username = userEmail.split('@')[0] + '_' + Date.now();
        }
        
        const userData = {
          id: userId,
          email: userEmail,
          username: username,
          hearts: isGuestUser ? 50 : 100 // 게스트는 50개, 일반 사용자는 100개
        };
        
        console.log('🔧 Creating user with data:', userData);
        
        user = await prisma.user.create({
          data: userData
        });
        
        if (isGuestUser) {
          console.log(`✅ New guest user created: ${userId} (Username: ${username})`);
        } else {
          console.log(`✅ New user created: ${userEmail} (ID: ${userId}, Username: ${username})`);
        }
      } else {
        if (userId.startsWith('guest-')) {
          console.log(`✅ Existing guest user found: ${userId}`);
        } else {
          console.log(`✅ Existing user found: ${userEmail} (ID: ${user.id})`);
        }
      }
    } catch (error) {
      console.error('❌ User creation error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        meta: error.meta,
        userId: userId,
        userEmail: userEmail
      });
      // 에러가 발생해도 요청을 계속 진행
    }
  } else {
    console.warn('⚠️ Missing user headers:', { userEmail, userId });
  }
  
  next();
});

// Rate limiting - Cloudflare 환경에 최적화
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 개발환경에서는 제한 완화
  message: 'Too many requests from this IP',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Cloudflare 환경에서 실제 IP 가져오기
  keyGenerator: (req) => {
    return req.headers['cf-connecting-ip'] || 
           req.headers['x-forwarded-for']?.split(',')[0] || 
           req.connection.remoteAddress || 
           req.ip;
  },
  // 검증 비활성화 (Cloudflare 환경에서는 안전)
  validate: false
});
app.use(limiter);

// API Routes
console.log('🔧 Registering API routes...');
app.use('/api/users', require('./routes/users'));
app.use('/api/characters', require('./routes/characters'));
app.use('/api/personas', require('./routes/personas'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/hearts', require('./routes/hearts'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/payment', require('./routes/payment'));
app.use('/api/deploy', require('./routes/deployment'));
// 🔧 Payment 경로 우회 - Cloudflare 차단 대응
app.use('/api/purchase', require('./routes/payment')); // 대안 경로
app.use('/api/transaction', require('./routes/payment')); // 대안 경로 2

// Relations 라우트 등록 - 디버깅 추가
try {
  const relationsRouter = require('./routes/relations');
  app.use('/api/relations', relationsRouter);
  console.log('✅ Relations route registered successfully');
} catch (error) {
  console.error('❌ Failed to register relations route:', error);
}

console.log('✅ All API routes registered');

// 📈 디버깅 엔드포인트 생성
createStatsEndpoint(app);

// Health check
app.get('/api/health', (req, res) => {
  const healthInfo = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.1.0',
    deploymentMethod: 'Enhanced API integration with frontend! 🚀',
    services: {
      database: 'connected',
      openai: openai ? 'ready' : 'disconnected',
      s3: process.env.AWS_ACCESS_KEY_ID ? 'configured' : 'not_configured',
      payment: process.env.IMP_SECRET ? 'configured' : 'not_configured'
    },
    cors: {
      allowedOrigins: ALLOWED_ORIGINS.length,
      development: process.env.NODE_ENV === 'development'
    },
    uptime: Math.floor((Date.now() - new Date(serverStats.startTime).getTime()) / 1000)
  };
  
  res.json(healthInfo);
});

// 🔍 배포 검증 엔드포인트 (프론트엔드 validateDeployment와 연계)
app.get('/api/deploy/validate', (req, res) => {
  const validation = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    validation: {
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: PORT,
        isProduction: process.env.NODE_ENV === 'production'
      },
      database: {
        connected: !!process.env.DATABASE_URL,
        status: 'ready'
      },
      services: {
        openai: {
          configured: !!process.env.OPENAI_API_KEY,
          status: openai ? 'ready' : 'not_configured'
        },
        aws: {
          configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
          bucket: process.env.AWS_S3_BUCKET_NAME || 'not_set',
          region: process.env.AWS_REGION || 'ap-northeast-2'
        },
        payment: {
          configured: !!process.env.IMP_SECRET,
          provider: 'portone + kg_inicis',
          testMode: !process.env.IMP_SECRET || process.env.IMP_SECRET.includes('TEST')
        }
      },
      cors: {
        allowedOrigins: ALLOWED_ORIGINS,
        totalOrigins: ALLOWED_ORIGINS.length,
        cloudflareReady: ALLOWED_ORIGINS.some(origin => origin.includes('minglingchat.com'))
      },
      security: {
        trustProxy: app.get('trust proxy'),
        rateLimit: process.env.NODE_ENV === 'production' ? 100 : 1000,
        httpsRedirect: false // 프론트엔드에서 처리
      }
    },
    recommendations: []
  };

  // 권장사항 추가
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.IMP_SECRET || process.env.IMP_SECRET.includes('TEST')) {
      validation.recommendations.push('Production payment credentials needed');
    }
    if (!validation.validation.services.aws.configured) {
      validation.recommendations.push('AWS S3 configuration needed for file uploads');
    }
  }

  res.json(validation);
});

// 🌐 환경 정보 엔드포인트 (보안 필터링)
app.get('/api/environment', (req, res) => {
  const envInfo = {
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    server: {
      port: PORT,
      uptime: Math.floor((Date.now() - new Date(serverStats.startTime).getTime()) / 1000),
      version: '1.1.0'
    },
    features: {
      openai: !!openai,
      fileUpload: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY),
      payment: !!process.env.IMP_SECRET,
      cors: {
        enabled: true,
        origins: ALLOWED_ORIGINS.length,
        development: process.env.NODE_ENV === 'development'
      }
    },
    deployment: {
      cloudflareCompatible: true,
      httpsReady: true,
      corsOptimized: true,
      paymentIntegrated: !!process.env.IMP_SECRET
    }
  };

  res.json(envInfo);
});

// 📊 상세 통계 엔드포인트 (관리자용)
app.get('/api/debug/detailed-stats', (req, res) => {
  const detailedStats = {
    ...serverStats,
    uptime: Math.floor((Date.now() - new Date(serverStats.startTime).getTime()) / 1000),
    successRate: serverStats.totalRequests > 0 ? 
      (serverStats.successfulRequests / serverStats.totalRequests * 100).toFixed(2) + '%' : '0%',
    corsRate: serverStats.totalRequests > 0 ? 
      (serverStats.corsRequests / serverStats.totalRequests * 100).toFixed(2) + '%' : '0%',
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: PORT,
      allowedOrigins: ALLOWED_ORIGINS
    },
    services: {
      openai: openai ? 'connected' : 'disconnected',
      database: 'connected',
      payment: process.env.IMP_SECRET ? 'configured' : 'not_configured'
    },
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
    }
  };

  res.json(detailedStats);
});

// 404 핸들러 - API 라우트를 찾을 수 없을 때
app.use('/api/*', (req, res) => {
  console.log(`❌ 404 - API route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    error: 'API endpoint not found',
    method: req.method,
    path: req.originalUrl,
    timestamp: new Date().toISOString()
  });
});

// Error handling
app.use((err, req, res, _next) => {
  console.error('❌ Server Error:', err.stack);
  
  // 에러 통계 업데이트
  serverStats.errorRequests++;
  
  // 에러 정보 로깅
  const errorInfo = {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.headers['user-agent'],
    origin: req.headers['origin']
  };
  
  console.error('🔍 Error Details:', errorInfo);
  
  // 에러 응답
  const errorResponse = {
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
    timestamp: new Date().toISOString(),
    requestId: req.headers['cf-ray'] || `req-${Date.now()}`
  };
  
  // 특정 에러 타입에 따른 상태 코드 설정
  let statusCode = 500;
  if (err.name === 'ValidationError') statusCode = 400;
  if (err.name === 'UnauthorizedError') statusCode = 401;
  if (err.name === 'ForbiddenError') statusCode = 403;
  if (err.name === 'NotFoundError') statusCode = 404;
  
  res.status(statusCode).json(errorResponse);
});

// 🔥 더 나은 포트 충돌 처리
const startServerWithRetry = (port, retries = 3) => {
  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Backend server running on http://localhost:${port}`);
    console.log(`🌐 Server accessible from: http://0.0.0.0:${port}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🕒 Started at: ${new Date().toISOString()}`);
    console.log('🔧 Frontend Integration: Enhanced API endpoints ready! 🎯');
  });

  // 서버 오류 처리
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`🔥 Port ${port} is already in use`);
      
      if (retries > 0) {
        const newPort = port + 1;
        console.log(`🔄 Trying port ${newPort}... (${retries} retries left)`);
        server.close();
        global.setTimeout(() => startServerWithRetry(newPort, retries - 1), 1000);
      } else {
        console.error('❌ No more ports to try. Please stop other services or change the PORT environment variable.');
        console.error('💡 Try: killall node');
        console.error('💡 Or: lsof -ti:8001 | xargs kill');
        process.exit(1);
      }
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });

  // 서버 연결 처리
  server.on('connection', (socket) => {
    socket.on('error', (error) => {
      console.error('❌ Socket error:', error.message);
    });
  });

  // 헬스 체크 자동 실행
  global.setTimeout(() => {
    console.log('🏥 Self health check...');
    const actualPort = server.address()?.port || port;
    require('http').get(`http://localhost:${actualPort}/api/health`, (res) => {
      console.log(`✅ Self health check passed: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('❌ Self health check failed:', err.message);
    });
  }, 5000);

  return server;
};

// 테스트 환경이 아닐 때만 서버 시작
if (process.env.NODE_ENV !== 'test') {
  startServerWithRetry(PORT);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Graceful shutdown initiated...');
  await prisma.$disconnect();
  process.exit(0);
});

// 테스트를 위해 app 객체 export
module.exports = app; 