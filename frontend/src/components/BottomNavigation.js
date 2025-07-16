import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { HomeIcon, HeartIcon, UserIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeIconSolid, HeartIcon as HeartIconSolid, UserIcon as UserIconSolid } from '@heroicons/react/24/solid';

const BottomNavigation = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    {
      name: '밍글링',
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
    <div className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md border-t z-50 bottom-navigation ${
      isForYouActive 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`} data-navigation="true">
      <div className="flex justify-around items-center py-2">
        {tabs.map((tab) => {
          const Icon = isActive(tab.path) ? tab.activeIcon : tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              data-navigation="true"
              className={`flex flex-col items-center space-y-1 p-3 transition-colors min-w-0 flex-1 ${
                isActive(tab.path)
                  ? isForYouActive 
                    ? 'text-white' 
                    : 'text-purple-600'
                  : isForYouActive
                    ? 'text-gray-400'
                    : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <Icon className="w-6 h-6" />
              <span className={`text-xs font-medium truncate w-full text-center ${
                isActive(tab.path)
                  ? isForYouActive 
                    ? 'text-white' 
                    : 'text-purple-600'
                  : isForYouActive
                    ? 'text-gray-400'
                    : 'text-gray-500'
              }`}>
                {tab.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNavigation; 