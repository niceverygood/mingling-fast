import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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
import { AuthProvider, useAuth } from './context/AuthContext';
import BottomNavigation from './components/BottomNavigation';
import './App.css';

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
      <div className="App">
        <div className="app-content">
          <Routes>
            <Route path="/" element={<ForYouPage />} />
            <Route path="/character-creation" element={<CharacterCreation />} />
            <Route path="/character/:id" element={<CharacterDetail />} />
            <Route path="/character/:id/edit" element={<CharacterEdit />} />
            <Route path="/chat/:chatId" element={<ChatPage />} />
            <Route path="/my-page" element={<MyPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/persona-creation" element={<PersonaCreation />} />
            <Route path="/persona/:id" element={<PersonaDetail />} />
            <Route path="/persona/:id/edit" element={<PersonaEdit />} />
            <Route path="/persona-management" element={<PersonaManagement />} />
            <Route path="/persona-selection" element={<PersonaSelection />} />
            <Route path="/heart-shop" element={<HeartShop />} />
            <Route path="/chat-list" element={<ChatListPage />} />
          </Routes>
        </div>
        <BottomNavigation />
      </div>
    </Router>
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