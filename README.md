# Mingling Fast - AI 캐릭터 채팅 앱

AI 캐릭터와 대화할 수 있는 모바일 웹 애플리케이션입니다.

## 🚀 기능

- **MY 페이지**: 사용자 프로필 관리, 하트 시스템, 캐릭터 생성
- **밍글링 페이지**: AI 캐릭터와의 채팅 목록 및 대화
- **For You 페이지**: 추천 AI 캐릭터 발견 및 스와이프

## 🛠 기술 스택

### 프론트엔드
- React 18
- Tailwind CSS
- React Router DOM
- Axios
- Heroicons

### 백엔드
- Node.js
- Express
- Prisma ORM
- MySQL

## 📦 설치 및 실행

### 1. 프론트엔드 설정

```bash
# 프론트엔드 디렉토리로 이동
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행 (포트 8000)
npm start
```

### 2. 백엔드 설정

```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env
# .env 파일에서 DATABASE_URL 등 설정

# MySQL 데이터베이스 생성
mysql -u root -e "CREATE DATABASE IF NOT EXISTS mingling_fast;"

# Prisma 설정
npx prisma generate
npx prisma db push

# 개발 서버 실행 (포트 8001)
npm run dev
```

### 3. 데이터베이스 설정

MySQL 데이터베이스를 생성하고 `.env` 파일에 연결 정보를 설정하세요.

```env
DATABASE_URL="mysql://username:password@localhost:3306/mingling_fast"
JWT_SECRET="your-jwt-secret-key"
PORT=8001
NODE_ENV=development
```

## 🌐 API 엔드포인트

### 사용자 관리
- `GET /api/users/profile` - 사용자 프로필 조회
- `PUT /api/users/profile` - 사용자 프로필 업데이트

### 캐릭터 관리
- `GET /api/characters/my` - 내가 만든 캐릭터 목록
- `GET /api/characters/recommended` - 추천 캐릭터 목록
- `POST /api/characters` - 새 캐릭터 생성

### 채팅
- `GET /api/chats` - 채팅 목록 조회
- `POST /api/chats` - 새 채팅 시작
- `GET /api/chats/:chatId/messages` - 채팅 메시지 조회
- `POST /api/chats/:chatId/messages` - 메시지 전송

### 하트 시스템
- `GET /api/hearts/balance` - 하트 잔액 조회
- `POST /api/hearts/charge` - 하트 충전
- `POST /api/hearts/spend` - 하트 사용

## 📱 화면 구성

1. **밍글링**: AI 캐릭터와의 채팅 목록
2. **For You**: 추천 캐릭터 카드 스와이프
3. **MY**: 사용자 프로필, 하트 관리, 캐릭터 생성

## 🎨 디자인

- 모바일 퍼스트 반응형 디자인
- Tailwind CSS를 활용한 모던 UI
- 하단 네비게이션을 통한 직관적인 탐색

---

# 🚀 **배포 가이드**

## 📦 **Vercel 프론트엔드 배포**

### **1단계: 저장소 연결**
1. [Vercel Dashboard](https://vercel.com/dashboard) 접속
2. "New Project" 클릭  
3. GitHub 저장소 선택: `niceverygood/mingling-fast`

### **2단계: 프로젝트 설정**
```bash
Framework Preset: Create React App
Root Directory: frontend
Build Command: npm run build  
Output Directory: build
Install Command: npm ci
```

### **3단계: 환경변수 설정**
Vercel 프로젝트 설정에서 다음 환경변수들을 추가:

```bash
# Firebase 설정
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# 백엔드 API URL (백엔드 배포 후 설정)
REACT_APP_API_BASE_URL=https://your-backend-domain.com
```

### **4단계: 배포 실행**
"Deploy" 버튼 클릭하여 자동 배포 시작

## 🖥 **백엔드 배포 옵션**

### **Railway 배포 (권장)**
1. [Railway](https://railway.app) 접속
2. GitHub 저장소 연결
3. Root Directory: `backend` 설정
4. 환경변수 설정:
```bash
DATABASE_URL=mysql://user:pass@host:port/database
OPENAI_API_KEY=your_openai_api_key
JWT_SECRET=your_jwt_secret_key_here
PORT=8001
NODE_ENV=production
ALLOWED_ORIGINS=https://your-vercel-domain.vercel.app
```

### **AWS EC2 배포**
```bash
# 서버 세팅
sudo apt update
sudo apt install nodejs npm mysql-server

# 애플리케이션 배포
git clone https://github.com/niceverygood/mingling-fast.git
cd mingling-fast/backend
npm install --production
npm run db:generate
npm run db:push
npm start
```

## 🔐 **보안 설정**
- ✅ Helmet.js (보안 헤더)
- ✅ HPP (파라미터 오염 방지)
- ✅ Rate Limiting (15분/100요청)
- ✅ CORS 환경변수 관리
- ✅ Winston 로깅 시스템

## 📄 라이선스

MIT License 