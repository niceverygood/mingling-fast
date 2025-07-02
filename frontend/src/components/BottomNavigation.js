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
    if (path === '/chats') {
      return location.pathname === '/' || location.pathname === '/chats';
    }
    return location.pathname === path;
  };

  // For You 탭이 활성화되었는지 확인
  const isForYouActive = isActive('/for-you');

  return (
    <div className={`fixed bottom-0 left-1/2 transform -translate-x-1/2 w-full max-w-md border-t ${
      isForYouActive 
        ? 'bg-gray-900 border-gray-700' 
        : 'bg-white border-gray-200'
    }`}>
      <div className="flex justify-around items-center py-2">
        {tabs.map((tab) => {
          const active = isActive(tab.path);
          const Icon = active ? tab.activeIcon : tab.icon;
          
          return (
            <button
              key={tab.name}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center py-2 px-4 min-w-0 flex-1"
            >
              <Icon 
                className={`w-6 h-6 ${
                  isForYouActive
                    ? active ? 'text-white' : 'text-gray-400'
                    : active ? 'text-black' : 'text-gray-400'
                }`} 
              />
              <span 
                className={`text-xs mt-1 ${
                  isForYouActive
                    ? active ? 'text-white font-medium' : 'text-gray-400'
                    : active ? 'text-black font-medium' : 'text-gray-400'
                }`}
              >
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