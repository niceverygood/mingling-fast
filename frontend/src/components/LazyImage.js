import React, { useState, useRef, useEffect } from 'react';

/**
 * 최적화된 이미지 컴포넌트
 * - Lazy loading
 * - 플레이스홀더 지원
 * - 에러 처리
 * - 로딩 상태
 */
const LazyImage = ({
  src,
  alt = '',
  placeholder = null,
  fallback = null,
  className = '',
  style = {},
  loading = 'lazy',
  quality = 80,
  sizes = '',
  onLoad = null,
  onError = null,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer를 사용한 lazy loading
  useEffect(() => {
    if (!imgRef.current || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    );

    observer.observe(imgRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading]);

  // 이미지 URL 최적화
  const getOptimizedImageUrl = (originalUrl) => {
    if (!originalUrl) return '';
    
    // S3 이미지인 경우 CloudFront를 통한 최적화
    if (originalUrl.includes('amazonaws.com') || originalUrl.includes('cloudfront.net')) {
      // 이미 최적화된 URL이면 그대로 반환
      if (originalUrl.includes('?')) return originalUrl;
      
      // 품질과 포맷 최적화 파라미터 추가
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}format=webp&quality=${quality}`;
    }
    
    return originalUrl;
  };

  const handleLoad = (e) => {
    setIsLoaded(true);
    if (onLoad) onLoad(e);
  };

  const handleError = (e) => {
    setHasError(true);
    if (onError) onError(e);
  };

  // 로딩 중 플레이스홀더
  const renderPlaceholder = () => {
    if (placeholder) {
      return placeholder;
    }
    
    return (
      <div 
        className={`bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
        style={style}
      >
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    );
  };

  // 에러 시 대체 이미지
  const renderFallback = () => {
    if (fallback) {
      return fallback;
    }
    
    return (
      <div 
        className={`bg-gray-100 flex items-center justify-center ${className}`}
        style={style}
      >
        <svg 
          className="w-8 h-8 text-gray-400" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    );
  };

  // 에러가 발생한 경우
  if (hasError) {
    return renderFallback();
  }

  // 아직 뷰포트에 들어오지 않은 경우
  if (!isInView) {
    return (
      <div ref={imgRef} className={className} style={style}>
        {renderPlaceholder()}
      </div>
    );
  }

  const optimizedSrc = getOptimizedImageUrl(src);

  return (
    <div ref={imgRef} className={`relative ${className}`} style={style}>
      {/* 로딩 중 플레이스홀더 */}
      {!isLoaded && (
        <div className="absolute inset-0">
          {renderPlaceholder()}
        </div>
      )}
      
      {/* 실제 이미지 */}
      <img
        src={optimizedSrc}
        alt={alt}
        loading={loading}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          ...style,
          position: isLoaded ? 'static' : 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        }}
        {...props}
      />
    </div>
  );
};

// 프리셋 컴포넌트들
export const AvatarImage = ({ src, alt, size = 'md', ...props }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  return (
    <LazyImage
      src={src}
      alt={alt}
      className={`rounded-full ${sizeClasses[size]} object-cover`}
      placeholder={
        <div className={`${sizeClasses[size]} rounded-full bg-gray-200 animate-pulse flex items-center justify-center`}>
          <svg className="w-1/2 h-1/2 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
      }
      {...props}
    />
  );
};

export const CharacterImage = ({ src, alt, ...props }) => {
  return (
    <LazyImage
      src={src}
      alt={alt}
      className="w-full h-48 object-cover rounded-lg"
      placeholder={
        <div className="w-full h-48 bg-gray-200 animate-pulse rounded-lg flex items-center justify-center">
          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
        </div>
      }
      {...props}
    />
  );
};

export default LazyImage; 