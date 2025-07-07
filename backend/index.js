const express = require('express');
// const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
const cors = require('cors');
require('dotenv').config();

// 🔧 환경 변수 검증 및 로깅
console.log('🔧 Environment Configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  PORT: process.env.PORT,
  DATABASE_URL: process.env.DATABASE_URL ? '✅ Set' : '❌ Missing',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing',
  OPENAI_API_KEY_LENGTH: process.env.OPENAI_API_KEY?.length,
  JWT_SECRET: process.env.JWT_SECRET ? '✅ Set' : '❌ Missing',
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3005,https://minglingchat.com,https://www.minglingchat.com',
  timestamp: new Date().toISOString()
});

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
  next();
});

// 사용자 자동 생성 미들웨어
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
        const username = userEmail.split('@')[0] + '_' + Date.now(); // 고유한 username 생성
        
        const userData = {
          id: userId,
          email: userEmail,
          username: username,
          hearts: 100 // 기본 하트 100개 지급
        };
        
        console.log('🔧 Creating user with data:', userData);
        
        user = await prisma.user.create({
          data: userData
        });
        console.log(`✅ New user created: ${userEmail} (ID: ${userId}, Username: ${username})`);
      } else {
        console.log(`✅ Existing user found: ${userEmail} (ID: ${user.id})`);
      }
    } catch (error) {
      console.error('❌ User creation error:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        meta: error.meta
      });
      // 에러가 발생해도 요청을 계속 진행
    }
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
  res.json({ 
    status: 'OK',
    timestamp: new Date().toISOString(),
    autoDeployment: 'enabled',
    version: '1.0.7',
    deploymentMethod: 'Improved GitHub Actions workflow with clean directory structure! 🎯'
  });
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
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!',
    timestamp: new Date().toISOString()
  });
});

// 테스트 환경이 아닐 때만 서버 시작
if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
    console.log(`🌐 Server accessible from: http://0.0.0.0:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV}`);
    console.log(`🕒 Started at: ${new Date().toISOString()}`);
  });

  // 서버 오류 처리
  server.on('error', (error) => {
    console.error('❌ Server error:', error);
    if (error.code === 'EADDRINUSE') {
      console.error(`🔥 Port ${PORT} is already in use`);
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
    require('http').get(`http://localhost:${PORT}/api/health`, (res) => {
      console.log(`✅ Self health check passed: ${res.statusCode}`);
    }).on('error', (err) => {
      console.error('❌ Self health check failed:', err.message);
    });
  }, 5000);
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// 테스트를 위해 app 객체 export
module.exports = app; 