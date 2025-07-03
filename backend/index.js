const express = require('express');
const cors = require('cors');
// const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 8001;

// Express 기본 설정 - 헤더 크기 제한 증가
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// CORS 설정 - Cloudflare 및 Vercel 환경 최적화
app.use(cors({
  origin: function (origin, callback) {
    // 허용된 도메인 목록
    const allowedOrigins = [
      'https://minglingchat.com',
      'https://www.minglingchat.com', 
      'https://mingling-new.vercel.app',
      'https://mingling-lqhx1ktyj-malshues-projects.vercel.app', // Vercel 프리뷰 도메인
      'http://localhost:3000', // 로컬 개발
      'http://localhost:8001'  // 로컬 백엔드
    ];
    
    // Origin이 없거나 (직접 접근) 허용된 도메인인 경우 허용
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('CORS blocked origin:', origin);
      callback(null, true); // 개발 중에는 모든 origin 허용
    }
  },
  credentials: true,
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-User-ID', 
    'X-User-Email',
    'X-Forwarded-For',
    'X-Real-IP',
    'CF-Ray',
    'CF-IPCountry'
  ],
  exposedHeaders: ['X-User-ID', 'X-User-Email'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// 프리플라이트 요청 명시적 처리
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID, X-User-Email');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 개발환경에서는 제한 완화
  message: 'Too many requests from this IP'
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

// Error handling
app.use((err, req, res, _next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
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