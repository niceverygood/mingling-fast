import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PopupProvider } from './context/PopupContext';
import performanceMonitor from './utils/monitoring';

// 페이지 컴포넌트들
import ForYouPage from './pages/ForYouPage';
import MyPage from './pages/MyPage';
import ChatListPage from './pages/ChatListPage';
import ChatPage from './pages/ChatPage';
import HeartShop from './pages/HeartShop/HeartShop';
import PersonaManagement from './pages/PersonaCreation/PersonaManagement';
import PersonaCreation from './pages/PersonaCreation/PersonaCreation';

// 컴포넌트들
import BottomNavigation from './components/BottomNavigation';
import GuestInterceptor from './components/GuestInterceptor';

// 에러 경계 컴포넌트
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // 성능 모니터링에 React 에러 기록
    performanceMonitor.recordError(error, {
      type: 'react_error_boundary',
      componentStack: errorInfo.componentStack
    });

    // 전역 React 에러 이벤트 발생
    window.dispatchEvent(new CustomEvent('react:error', {
      detail: { error, componentStack: errorInfo.componentStack }
    }));
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-slate-100">
          <div className="max-w-sm mx-auto text-center p-6">
            <div className="text-5xl mb-4">😵</div>
            <h1 className="text-heading-md text-gray-900 mb-3">
              앗, 문제가 발생했어요!
            </h1>
            <p className="text-body-sm text-gray-600 mb-6 leading-relaxed">
              페이지를 새로고침하거나 잠시 후 다시 시도해주세요.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="btn-gradient px-6 py-2.5 rounded-lg text-body-sm font-medium"
            >
              새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 하단 네비게이션을 조건부로 렌더링하는 컴포넌트
function ConditionalBottomNavigation() {
  const location = useLocation();
  
  // 하단 네비게이션이 보여야 하는 페이지들
  const visiblePaths = [
    '/',
    '/for-you',
    '/my',
    '/chats',
    '/heart-shop',
    '/relationships',
    '/settings'
  ];
  
  // 정확히 일치하거나 하위 경로인 경우를 확인
  const shouldShowNavigation = visiblePaths.some(path => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  });
  
  // 특별히 숨겨야 하는 페이지들 (우선순위 높음)
  const hiddenPaths = [
    '/chat/', // 개별 채팅룸
    '/character/create',
    '/character/edit',
    '/persona/create', 
    '/persona/edit',
    '/login',
    '/signup'
  ];
  
  const shouldHideNavigation = hiddenPaths.some(path => location.pathname.includes(path));
  
  // 숨겨야 하는 페이지라면 숨기기 (우선순위)
  if (shouldHideNavigation) {
    return null;
  }
  
  // 보여야 하는 페이지라면 보이기
  if (shouldShowNavigation) {
    return <BottomNavigation />;
  }
  
  // 기본적으로는 보이기 (새로운 페이지 추가 시 안전)
  return <BottomNavigation />;
}

function App() {
  useEffect(() => {
    // 앱 시작 시 사용자 액션 기록
    performanceMonitor.recordUserAction('app_start', {
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    });

    // 페이지 가시성 변경 추적
    const handleVisibilityChange = () => {
      performanceMonitor.recordUserAction(
        document.hidden ? 'page_hidden' : 'page_visible',
        { timestamp: Date.now() }
      );
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return (
    <ErrorBoundary>
      <PopupProvider>
        <AuthProvider>
          <GuestInterceptor>
            <Router>
              <div className="App">
                <Routes>
                  <Route path="/" element={<ForYouPage />} />
                  <Route path="/for-you" element={<ForYouPage />} />
                  <Route path="/my" element={<MyPage />} />
                  <Route path="/chats" element={<ChatListPage />} />
                  <Route path="/chat/:chatId" element={<ChatPage />} />
                  <Route path="/heart-shop" element={<HeartShop />} />
                  <Route path="/persona-management" element={<PersonaManagement />} />
                  <Route path="/persona-creation" element={<PersonaCreation />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
                <ConditionalBottomNavigation />
              </div>
            </Router>
          </GuestInterceptor>
        </AuthProvider>
      </PopupProvider>
    </ErrorBoundary>
  );
}

export default App; 