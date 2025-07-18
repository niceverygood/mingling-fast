import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, HeartIcon, UserIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, HeartIcon as HeartIconSolid, UserIcon as UserIconSolid } from '@heroicons/react/24/solid';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      name: '홈',
      path: '/chats',
      icon: HomeIcon,
      activeIcon: HomeIconSolid,
    },
    {
      name: 'For You',
      path: '/for-you',
      icon: HeartIcon,
      activeIcon: HeartIconSolid,
    },
    {
      name: 'MY',
      path: '/my',
      icon: UserIcon,
      activeIcon: UserIconSolid,
    },
  ];

  const isActive = (path) => {
    if (path === '/for-you') {
      return location.pathname === '/' || location.pathname === '/for-you';
    }
    if (path === '/chats') {
      return location.pathname === '/chats';
    }
    return location.pathname === path;
  };

  // For You 탭이 활성화되었는지 확인
  const isForYouActive = isActive('/for-you');

  return (
    <div className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md z-50 bottom-navigation transition-all duration-300 ${
      isForYouActive 
        ? 'glass-dark' 
        : 'glass'
    }`} data-navigation="true">
      <div className="flex justify-around items-center py-2 px-1">
        {tabs.map((tab) => {
          const Icon = isActive(tab.path) ? tab.activeIcon : tab.icon;
          const active = isActive(tab.path);
          
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              data-navigation="true"
              className={`flex flex-col items-center justify-center space-y-0.5 py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1 group relative overflow-hidden ${
                active
                  ? isForYouActive 
                    ? 'text-white' 
                    : 'text-violet-600'
                  : isForYouActive
                    ? 'text-gray-400 hover:text-gray-200'
                    : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {/* 활성 상태 배경 */}
              {active && !isForYouActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-violet-50 to-purple-50 rounded-lg opacity-80" />
              )}
              {active && isForYouActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-white/5 rounded-lg" />
              )}
              
              <div className="relative z-10 flex flex-col items-center space-y-0.5">
                <Icon className={`transition-all duration-200 ${
                  active ? 'w-5 h-5' : 'w-4.5 h-4.5'
                } group-active:scale-95`} />
                <span className={`text-caption font-medium transition-all duration-200 ${
                  active
                    ? isForYouActive 
                      ? 'text-white' 
                      : 'text-violet-600'
                    : isForYouActive
                      ? 'text-gray-400'
                      : 'text-gray-500'
                }`}>
                  {tab.name}
                </span>
              </div>
              
              {/* 활성 상태 인디케이터 */}
              {active && (
                <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full transition-all duration-200 ${
                  isForYouActive ? 'bg-white' : 'bg-violet-600'
                }`} />
              )}
            </button>
          );
        })}
      </div>
      
      {/* 하단 안전 영역 패딩 */}
      <div className="pb-safe" />
    </div>
  );
};

export default BottomNavigation; 