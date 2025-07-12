import React from 'react';

const Avatar = ({ 
  src, 
  alt, 
  name, 
  size = 'md', 
  className = '', 
  fallbackType = 'initial', // 'initial', 'icon', 'emoji'
  onClick = null, // 클릭 핸들러 추가
  clickable = false // 클릭 가능 여부
}) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-xl',
    xl: 'w-24 h-24 text-3xl'
  };

  const getInitials = (name) => {
    if (!name) return '?';
    
    // 한글인 경우 첫 글자만
    if (/[가-힣]/.test(name)) {
      return name.charAt(0);
    }
    
    // 영문인 경우 첫 글자들
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getFallbackContent = () => {
    switch (fallbackType) {
      case 'icon':
        return '👤';
      case 'emoji':
        return '🤖';
      case 'initial':
      default:
        return getInitials(name || alt);
    }
  };

  const getGradientClass = (name) => {
    if (!name) return 'from-gray-100 to-gray-200';
    
    const gradients = [
      'from-pink-100 to-purple-100',
      'from-blue-100 to-indigo-100',
      'from-green-100 to-teal-100',
      'from-yellow-100 to-orange-100',
      'from-red-100 to-pink-100',
      'from-purple-100 to-blue-100',
      'from-indigo-100 to-purple-100',
      'from-teal-100 to-green-100'
    ];
    
    // 이름의 첫 글자를 기준으로 그라디언트 선택
    const index = (name.charCodeAt(0) || 0) % gradients.length;
    return gradients[index];
  };

  const getTextColor = (name) => {
    if (!name) return 'text-gray-600';
    
    const colors = [
      'text-pink-600',
      'text-blue-600',
      'text-green-600',
      'text-yellow-600',
      'text-red-600',
      'text-purple-600',
      'text-indigo-600',
      'text-teal-600'
    ];
    
    const index = (name.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  };

  const handleClick = (e) => {
    if (onClick) {
      e.stopPropagation(); // 부모 요소의 클릭 이벤트 방지
      onClick();
    }
  };

  // 클릭 가능한 스타일 추가
  const clickableStyles = (clickable || onClick) ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';

  return (
    <div 
      className={`${sizeClasses[size]} bg-gradient-to-br ${getGradientClass(name)} rounded-full flex items-center justify-center overflow-hidden ${className} ${clickableStyles}`}
      onClick={handleClick}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt || name || '프로필'} 
          className={`${sizeClasses[size]} rounded-full object-cover`}
          onError={(e) => {
            // 이미지 로드 실패 시 img 태그를 숨기고 대체 콘텐츠 표시
            e.target.style.display = 'none';
            e.target.nextSibling.style.display = 'flex';
          }}
        />
      ) : null}
      <span 
        className={`${fallbackType === 'initial' ? getTextColor(name) : 'text-gray-600'} font-bold flex items-center justify-center ${sizeClasses[size]} ${src ? 'hidden' : 'flex'}`}
        style={{ display: src ? 'none' : 'flex' }}
      >
        {getFallbackContent()}
      </span>
    </div>
  );
};

export default Avatar; 