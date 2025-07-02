import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MyPage from './pages/MyPage';
import ChatListPage from './pages/ChatListPage';
import ForYouPage from './pages/ForYouPage';
import ChatPage from './pages/ChatPage';
import BottomNavigation from './components/BottomNavigation';
import PersonaManagement from './pages/PersonaCreation/PersonaManagement';
import PersonaCreation from './pages/PersonaCreation/PersonaCreation';
import PersonaEdit from './pages/PersonaCreation/PersonaEdit';
import TestPage from './TestPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function AppContent() {
  const location = useLocation();
  const { loading } = useAuth();
  
  // 하단 네비게이션을 숨길 경로들
  const hideBottomNavPaths = [
    '/persona-management',
    '/persona-creation',
    '/chat/',
  ];
  
  const shouldHideBottomNav = hideBottomNavPaths.some(path => 
    location.pathname.startsWith(path)
  ) || location.pathname.includes('/persona-edit/');

  // Firebase 인증 상태 확인 중일 때 로딩 화면
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">앱을 준비하고 있어요...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-white">
      {/* Main Content */}
      <div className="max-w-md mx-auto bg-white min-h-screen relative">
        <Routes>
          <Route path="/app" element={<ChatListPage />} />
          <Route path="/chats" element={<ChatListPage />} />
          <Route path="/for-you" element={<ForYouPage />} />
          <Route path="/my" element={<MyPage />} />
          <Route path="/chat/:chatId" element={<ChatPage />} />
          <Route path="/persona-management" element={<PersonaManagement />} />
          <Route path="/persona-creation" element={<PersonaCreation />} />
          <Route path="/persona-edit/:id" element={<PersonaEdit />} />
        </Routes>
        
        {/* Bottom Navigation */}
        {!shouldHideBottomNav && <BottomNavigation />}
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<TestPage />} />
        <Route path="/*" element={
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        } />
      </Routes>
    </Router>
  );
}

export default App; 