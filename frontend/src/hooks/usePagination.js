import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * 페이지네이션 및 무한 스크롤 커스텀 훅
 * @param {Function} fetchFunction - 데이터를 가져오는 함수
 * @param {Object} options - 설정 옵션
 */
export const usePagination = (fetchFunction, options = {}) => {
  const {
    initialPage = 1,
    pageSize = 10,
    enableInfiniteScroll = false,
    threshold = 0.8, // 무한 스크롤 트리거 위치 (80%)
    dependencies = [], // 의존성 배열
    cacheKey = null, // 캐시 키
    maxCacheAge = 5 * 60 * 1000 // 5분
  } = options;

  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  const observerRef = useRef(null);
  const loadingRef = useRef(null);
  const cacheRef = useRef(new Map());

  // 캐시 관리
  const getCachedData = useCallback((key) => {
    if (!cacheKey || !key) return null;
    
    const cached = cacheRef.current.get(key);
    if (!cached) return null;
    
    const isExpired = Date.now() - cached.timestamp > maxCacheAge;
    if (isExpired) {
      cacheRef.current.delete(key);
      return null;
    }
    
    return cached.data;
  }, [cacheKey, maxCacheAge]);

  const setCachedData = useCallback((key, data) => {
    if (!cacheKey || !key) return;
    
    cacheRef.current.set(key, {
      data,
      timestamp: Date.now()
    });
  }, [cacheKey]);

  // 데이터 로드 함수
  const loadData = useCallback(async (page = currentPage, append = false) => {
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);

      // 캐시 확인
      const cacheKeyForPage = cacheKey ? `${cacheKey}_${page}` : null;
      const cachedData = getCachedData(cacheKeyForPage);
      
      if (cachedData) {
        console.log(`📦 캐시에서 데이터 로드: 페이지 ${page}`);
        
        if (append) {
          setData(prev => [...prev, ...cachedData.items]);
        } else {
          setData(cachedData.items);
        }
        
        setTotalPages(cachedData.totalPages);
        setTotalItems(cachedData.totalItems);
        setHasMore(page < cachedData.totalPages);
        setLoading(false);
        return;
      }

      // API 호출
      console.log(`🔄 API에서 데이터 로드: 페이지 ${page}`);
      const response = await fetchFunction({
        page,
        limit: pageSize,
        offset: (page - 1) * pageSize
      });

      const result = response.data || response;
      const items = result.items || result.data || result;
      const totalPages = result.totalPages || Math.ceil((result.total || items.length) / pageSize);
      const totalItems = result.total || items.length;

      // 캐시 저장
      if (cacheKeyForPage) {
        setCachedData(cacheKeyForPage, {
          items,
          totalPages,
          totalItems
        });
      }

      if (append) {
        setData(prev => [...prev, ...items]);
      } else {
        setData(items);
      }

      setTotalPages(totalPages);
      setTotalItems(totalItems);
      setHasMore(page < totalPages);
      
    } catch (err) {
      console.error('❌ 페이지네이션 데이터 로드 실패:', err);
      setError(err.userMessage || err.message || '데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, fetchFunction, loading, getCachedData, setCachedData, cacheKey]);

  // 페이지 변경
  const goToPage = useCallback((page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    
    setCurrentPage(page);
    
    if (!enableInfiniteScroll) {
      loadData(page, false);
    }
  }, [currentPage, totalPages, enableInfiniteScroll, loadData]);

  // 다음 페이지 로드 (무한 스크롤용)
  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    loadData(nextPage, true);
  }, [currentPage, hasMore, loading, loadData]);

  // 데이터 새로고침
  const refresh = useCallback(() => {
    // 캐시 클리어
    if (cacheKey) {
      cacheRef.current.clear();
    }
    
    setCurrentPage(initialPage);
    setData([]);
    setError(null);
    loadData(initialPage, false);
  }, [initialPage, loadData, cacheKey]);

  // 무한 스크롤 Intersection Observer
  useEffect(() => {
    if (!enableInfiniteScroll || !loadingRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !loading) {
          loadMore();
        }
      },
      {
        threshold,
        rootMargin: '100px'
      }
    );

    observer.observe(loadingRef.current);
    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [enableInfiniteScroll, hasMore, loading, loadMore, threshold]);

  // 초기 데이터 로드 및 의존성 변경 시 재로드
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  // 페이지네이션 정보
  const paginationInfo = {
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    hasMore,
    hasPrevious: currentPage > 1,
    startItem: (currentPage - 1) * pageSize + 1,
    endItem: Math.min(currentPage * pageSize, totalItems)
  };

  return {
    // 데이터
    data,
    loading,
    error,
    
    // 페이지네이션 정보
    ...paginationInfo,
    
    // 액션
    goToPage,
    loadMore,
    refresh,
    
    // 무한 스크롤용 ref
    loadingRef,
    
    // 유틸리티
    isEmpty: !loading && data.length === 0,
    isFirstPage: currentPage === 1,
    isLastPage: currentPage === totalPages
  };
};

/**
 * 무한 스크롤 전용 훅
 */
export const useInfiniteScroll = (fetchFunction, options = {}) => {
  return usePagination(fetchFunction, {
    ...options,
    enableInfiniteScroll: true
  });
};

/**
 * 일반 페이지네이션 전용 훅
 */
export const usePagedData = (fetchFunction, options = {}) => {
  return usePagination(fetchFunction, {
    ...options,
    enableInfiniteScroll: false
  });
};

export default usePagination; 