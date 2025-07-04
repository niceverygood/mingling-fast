const express = require('express');
// const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
const cors = require('cors');
require('dotenv').config();

// OpenAI 초기화
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length);

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

// Express 기본 설정 - 헤더 크기 제한 증가
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🌐 Cloudflare Transform Rules 없이 백엔드 단독 CORS 해결
const corsOptions = {
  origin: function (origin, callback) {
    // 허용된 origins 목록
    const allowedOrigins = [
      'https://www.minglingchat.com',
      'https://minglingchat.com',
      'https://mingling-new.vercel.app',
      'http://localhost:3000',
      'http://localhost:3001'
    ];
    
    // Origin이 없는 경우 (같은 도메인, 모바일 앱 등) 허용
    if (!origin) {
      console.log('✅ CORS: No origin header - allowing request');
      return callback(null, true);
    }
    
    // 허용된 origin인지 확인
    if (allowedOrigins.includes(origin)) {
      console.log('✅ CORS: Origin allowed:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS: Origin rejected:', origin);
    return callback(null, true); // 임시로 모든 origin 허용
  },
  
  credentials: false,
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
    'X-CSRF-Token'
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
  const allowedOrigins = [
    'https://www.minglingchat.com',
    'https://minglingchat.com',
    'https://mingling-new.vercel.app',
    'http://localhost:3000',
    'http://localhost:3001'
  ];
  
  // Origin 설정 (Cloudflare 환경 고려)
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Origin 헤더가 없는 경우 (Cloudflare 프록시 등)
    res.header('Access-Control-Allow-Origin', '*');
  } else {
    // 허용되지 않은 origin도 임시로 허용
    res.header('Access-Control-Allow-Origin', '*');
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
  
  // 요청 정보 로깅
  console.log('🌐 Request:', {
    method: req.method,
    url: req.url,
    origin: origin,
    cfRay: req.headers['cf-ray'],
    cfCountry: req.headers['cf-ipcountry'],
    userAgent: req.headers['user-agent']?.substring(0, 30) + '...'
  });
  
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
      origin: origin
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
      // 사용자가 존재하는지 확인
      let user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      // 사용자가 없으면 자동 생성
      if (!user) {
        user = await prisma.user.create({
          data: {
            id: userId,
            email: userEmail,
            name: userEmail.split('@')[0], // 이메일의 @ 앞부분을 이름으로 사용
            hearts: 100 // 기본 하트 100개 지급
          }
        });
        console.log(`✅ New user created: ${userEmail} (ID: ${userId})`);
      }
    } catch (error) {
      console.error('❌ User creation error:', error);
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
app.use('/api/users', require('./routes/users'));
app.use('/api/characters', require('./routes/characters'));
app.use('/api/personas', require('./routes/personas'));
app.use('/api/chats', require('./routes/chats'));
app.use('/api/conversations', require('./routes/conversations'));
app.use('/api/hearts', require('./routes/hearts'));
app.use('/api/auth', require('./routes/auth'));

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
  app.listen(PORT, () => {
    console.log(`🚀 Backend server running on http://localhost:${PORT}`);
  });
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

// 테스트를 위해 app 객체 export
module.exports = app; 