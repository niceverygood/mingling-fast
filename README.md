# 🎭 밍글링 (Mingling) - AI 캐릭터 채팅 플랫폼

AI 캐릭터와의 몰입감 있는 채팅 경험을 제공하는 웹 애플리케이션입니다.

## ✨ 주요 기능

### 🤖 AI 캐릭터 채팅
- OpenAI GPT 기반 자연스러운 대화
- 캐릭터별 개성과 성격 반영
- 실시간 타이핑 애니메이션
- 대화 히스토리 저장

### 👤 캐릭터 시스템
- **캐릭터 생성**: 상세한 프로필과 성격 설정
- **캐릭터 카테고리**: 애니메이션, 게임, 영화, 순수창작 등
- **이미지 업로드**: S3 연동 프로필 이미지
- **해시태그 시스템**: 캐릭터 분류 및 검색

### 💕 호감도 시스템
- **7단계 관계 발전**: 아는 사람 → 친구 → 썸 전야 → 연인 → 진지한 관계 → 약혼 → 결혼
- **AI 기반 메시지 평가**: 대화 내용에 따른 호감도 변화
- **감쇠 시스템**: 시간에 따른 자연스러운 관계 변화
- **이벤트 로깅**: 관계 변화 히스토리 추적

### 💖 하트 시스템
- **하트 기반 채팅**: 메시지 전송 시 하트 소모
- **결제 시스템**: 포트원(아임포트) 연동 하트 충전
- **실시간 잔액 관리**: 전역 상태 동기화
- **인앱결제 지원**: 모바일 앱 내 결제

### 🎨 페르소나 시스템
- **사용자 페르소나**: 나만의 캐릭터 설정
- **역할 기반 대화**: 페르소나에 따른 대화 스타일 변화
- **다중 페르소나**: 여러 정체성으로 다양한 경험

## 🚀 최신 개선사항 (2024.01)

### 🛡️ 에러 처리 강화
- **사용자 친화적 에러 메시지**: 기술적 오류를 이해하기 쉬운 문구로 변환
- **자동 재시도 로직**: 네트워크 오류 시 지수 백오프 재시도
- **오프라인 대응**: 인터넷 연결 상태 감지 및 대응
- **에러 경계**: React 에러 경계로 앱 전체 크래시 방지

### ⚡ 성능 최적화
- **이미지 Lazy Loading**: Intersection Observer 기반 지연 로딩
- **무한 스크롤**: 페이지네이션과 캐싱을 통한 부드러운 스크롤
- **다층 캐싱**: 메모리 + localStorage 캐싱 시스템
- **API 응답 최적화**: 중복 요청 방지 및 응답 캐싱

### 🔐 인증 시스템 개선
- **전역 인증 핸들러**: 401 에러 시 자동 로그인 모달
- **토큰 만료 처리**: 자동 로그아웃 및 재로그인 유도
- **인증 헤더 자동화**: 모든 API 요청에 자동 인증 헤더 포함

### 💖 하트 실시간 업데이트
- **전역 상태 관리**: 하트 잔액 실시간 동기화
- **낙관적 업데이트**: 즉시 UI 반영 후 서버 동기화
- **에러 롤백**: 실패 시 이전 상태로 자동 복구

### 📊 모니터링 시스템
- **성능 메트릭**: Core Web Vitals (LCP, FID, CLS) 추적
- **API 성능 추적**: 응답 시간 및 에러율 모니터링
- **사용자 행동 분석**: 페이지 방문, 클릭, 가시성 추적
- **에러 추적**: 자동 에러 수집 및 분석

## 🏗️ 기술 스택

### Frontend
- **React 18**: 최신 React 기능 활용
- **TypeScript**: 타입 안전성 보장
- **Tailwind CSS**: 유틸리티 기반 스타일링
- **React Router**: SPA 라우팅
- **Axios**: HTTP 클라이언트

### Backend
- **Node.js + Express**: RESTful API 서버
- **Prisma ORM**: 타입 안전 데이터베이스 액세스
- **MySQL**: 관계형 데이터베이스
- **OpenAI API**: GPT 기반 AI 채팅

### Infrastructure
- **AWS S3**: 이미지 저장소
- **AWS CloudFront**: CDN
- **AWS RDS**: 관리형 MySQL
- **AWS EC2**: 백엔드 서버
- **Vercel**: 프론트엔드 배포
- **Cloudflare**: DNS 및 프록시

### Payment & Analytics
- **포트원(아임포트)**: 결제 시스템
- **KG이니시스**: PG사
- **Google Analytics**: 사용자 분석

## 📁 프로젝트 구조

```
mingling_new/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # 재사용 가능한 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── services/       # API 서비스
│   │   ├── utils/          # 유틸리티 함수
│   │   ├── context/        # React Context
│   │   └── config/         # 설정 파일
│   └── package.json
├── backend/                  # Node.js 백엔드
│   ├── routes/             # API 라우트
│   ├── services/           # 비즈니스 로직
│   ├── prisma/             # 데이터베이스 스키마
│   ├── utils/              # 유틸리티
│   └── package.json
└── README.md
```

## 🚀 빠른 시작

### 1. 저장소 클론
```bash
git clone https://github.com/niceverygood/mingling_new.git
cd mingling_new
```

### 2. 백엔드 설정
```bash
cd backend
npm install
```

환경 변수 설정 (`.env` 파일 생성):
```env
NODE_ENV=development
PORT=8001
JWT_SECRET="your_jwt_secret"
DATABASE_URL="mysql://username:password@localhost:3306/mingling_dev"
OPENAI_API_KEY="your_openai_api_key"
ALLOWED_ORIGINS="http://localhost:3000,http://localhost:8000"
```

데이터베이스 설정:
```bash
npx prisma generate
npx prisma db push
```

백엔드 서버 실행:
```bash
npm run dev
```

### 3. 프론트엔드 설정
```bash
cd ../frontend
npm install
npm start
```

## 🔧 주요 설정

### API 엔드포인트
- **개발**: `http://localhost:8001`
- **프로덕션**: `https://api.minglingchat.com`

### 데이터베이스
- **개발**: 로컬 MySQL
- **프로덕션**: AWS RDS MySQL

### 결제 시스템
- **PG사**: KG이니시스
- **결제 모듈**: 포트원(아임포트)
- **지원 결제**: 카드, 계좌이체, 간편결제

## 📱 모바일 지원

- **반응형 웹**: 모든 디바이스 최적화
- **PWA 지원**: 앱처럼 설치 가능
- **터치 최적화**: 모바일 제스처 지원
- **WebView 호환**: 네이티브 앱 내 웹뷰

## 🔒 보안 및 개인정보

- **HTTPS 강제**: 모든 통신 암호화
- **CORS 설정**: 허용된 도메인만 접근
- **JWT 인증**: 토큰 기반 인증
- **개인정보 보호**: GDPR/CCPA 준수

## 📈 성능 최적화

- **Core Web Vitals**: LCP < 2.5s, FID < 100ms, CLS < 0.1
- **이미지 최적화**: WebP 포맷, 적응형 크기
- **코드 분할**: 라우트별 청크 분리
- **CDN 활용**: 정적 자원 전역 배포

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

## 📞 연락처

- **프로젝트 링크**: [https://github.com/niceverygood/mingling_new](https://github.com/niceverygood/mingling_new)
- **웹사이트**: [https://minglingchat.com](https://minglingchat.com)

---

*Made with ❤️ by the Mingling Team* 