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

// CORS 설정 - 개발용으로 간소화

// Security middlewares - 개발환경에서는 helmet 비활성화
// app.use(helmet({
//   crossOriginEmbedderPolicy: false
// }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 100, // 개발환경에서는 제한 완화
  message: 'Too many requests from this IP'
});
app.use(limiter);

app.use(cors({
  origin: function (origin, callback) {
    // 모든 origin 허용 (CORS 문제 해결을 위해)
    callback(null, true);
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-User-ID', 'X-User-Email'],
  exposedHeaders: ['X-User-ID', 'X-User-Email'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 200
}));

// 프리플라이트 요청 명시적 처리
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-ID, X-User-Email');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

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