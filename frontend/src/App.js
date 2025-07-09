import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import ForYouPage from './pages/ForYouPage';
import CharacterCreation from './pages/CharacterCreation/CharacterCreation';
import CharacterDetail from './pages/CharacterCreation/CharacterDetail';
import CharacterEdit from './pages/CharacterCreation/CharacterEdit';
import ChatPage from './pages/ChatPage';
import MyPage from './pages/MyPage';
import Settings from './pages/Settings/Settings';
import PersonaCreation from './pages/PersonaCreation/PersonaCreation';
import PersonaDetail from './pages/PersonaCreation/PersonaDetail';
import PersonaEdit from './pages/PersonaCreation/PersonaEdit';
import PersonaManagement from './pages/PersonaCreation/PersonaManagement';
import PersonaSelection from './pages/PersonaCreation/PersonaSelection';
import HeartShop from './pages/HeartShop/HeartShop';
import ChatListPage from './pages/ChatListPage';
import TestWebView from './pages/TestWebView';
import TestFavorability from './pages/TestFavorability';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import { AuthProvider, useAuth } from './context/AuthContext';
import BottomNavigation from './components/BottomNavigation';
import './App.css';
import RelationshipPage from './pages/RelationshipPage';

function AppContent() {
  const { loading } = useAuth();

  // Firebase 인증 상태 확인 중일 때 로딩 화면
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-black">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white">앱을 준비하고 있어요...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <AppWithNavigation />
    </Router>
  );
}

function AppWithNavigation() {
  const location = useLocation();
  
  // 하단 네비게이션을 숨길 페이지들
  const hideBottomNav = [
    '/chat/', // 채팅 페이지 (동적 경로 포함)
    '/character-creation',
    '/character/',
    '/persona-creation',
    '/persona/',
    '/settings',
    '/heart-shop',
    '/persona-management',
    '/persona-selection',
    '/test-webview',
    '/privacy-policy',
    '/terms-of-service'
  ];

  // 현재 경로가 하단 네비게이션을 숨겨야 하는 페이지인지 확인
  const shouldHideBottomNav = hideBottomNav.some(path => 
    location.pathname.startsWith(path) || location.pathname.includes(path)
  );

  return (
    <div className="App">
      <div className="app-content">
        <Routes>
          <Route path="/" element={<ForYouPage />} />
          <Route path="/for-you" element={<ForYouPage />} />
          <Route path="/chats" element={<ChatListPage />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/relationship/:characterId" element={<RelationshipPage />} />
          <Route path="/my" element={<MyPage />} />
          <Route path="/character-creation" element={<CharacterCreation />} />
          <Route path="/character/:id" element={<CharacterDetail />} />
          <Route path="/character/:id/edit" element={<CharacterEdit />} />
          <Route path="/persona-management" element={<PersonaManagement />} />
          <Route path="/persona-selection" element={<PersonaSelection />} />
          <Route path="/heart-shop" element={<HeartShop />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/test-webview" element={<TestWebView />} />
          <Route path="/test-favorability" element={<TestFavorability />} />
        </Routes>
      </div>
      {!shouldHideBottomNav && <BottomNavigation />}
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App; 