import { useState, useEffect, useCallback } from 'react';
import { heartsAPI } from '../services/api';
import { cacheAPI, getCacheKey } from '../utils/cache';

/**
 * 하트 잔액 실시간 관리 훅
 */
export const useHearts = () => {
  const [hearts, setHearts] = useState(150); // 기본값
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // 하트 잔액 조회
  const fetchHearts = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);

      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('사용자 ID가 없습니다.');
      }

      const cacheKey = getCacheKey.hearts(userId);
      
      const response = await cacheAPI.cachedFetch(
        cacheKey,
        () => heartsAPI.getBalance(),
        {
          ttl: 60 * 1000, // 1분 캐시
          forceRefresh
        }
      );

      const newHearts = response.data?.hearts || response.hearts || 150;
      setHearts(newHearts);
      setLastUpdated(new Date());

      return newHearts;
    } catch (err) {
      console.error('❌ 하트 잔액 조회 실패:', err);
      setError(err.userMessage || err.message || '하트 잔액을 불러올 수 없습니다.');
      
      // 에러 시 캐시된 값 사용 시도
      const userId = localStorage.getItem('userId');
      if (userId) {
        const cached = localStorage.getItem(`heartBalance_${userId}`);
        if (cached) {
          try {
            const cachedData = JSON.parse(cached);
            setHearts(cachedData.hearts || 150);
          } catch (e) {
            console.warn('캐시된 하트 데이터 파싱 실패:', e);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // 하트 사용
  const spendHearts = useCallback(async (amount, description = '') => {
    try {
      setLoading(true);
      setError(null);

      // 낙관적 업데이트
      const previousHearts = hearts;
      setHearts(prev => Math.max(0, prev - amount));

      const response = await heartsAPI.spend(amount, description);
      const newHearts = response.data?.hearts;

      if (newHearts !== undefined) {
        setHearts(newHearts);
        setLastUpdated(new Date());
        
        // 캐시 무효화
        const userId = localStorage.getItem('userId');
        if (userId) {
          cacheAPI.invalidate(getCacheKey.hearts(userId));
        }
      }

      return response;
    } catch (err) {
      // 실패 시 이전 값으로 롤백
      setHearts(hearts);
      setError(err.userMessage || err.message || '하트 사용에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [hearts]);

  // 하트 충전
  const chargeHearts = useCallback(async (amount) => {
    try {
      setLoading(true);
      setError(null);

      // 낙관적 업데이트
      setHearts(prev => prev + amount);

      const response = await heartsAPI.charge(amount);
      const newHearts = response.data?.hearts;

      if (newHearts !== undefined) {
        setHearts(newHearts);
        setLastUpdated(new Date());
        
        // 캐시 무효화
        const userId = localStorage.getItem('userId');
        if (userId) {
          cacheAPI.invalidate(getCacheKey.hearts(userId));
        }
      }

      return response;
    } catch (err) {
      // 실패 시 이전 값으로 롤백 (충전 실패)
      setHearts(prev => Math.max(0, prev - amount));
      setError(err.userMessage || err.message || '하트 충전에 실패했습니다.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // 하트 잔액 수동 설정 (결제 완료 후 등)
  const updateHearts = useCallback((newHearts) => {
    setHearts(newHearts);
    setLastUpdated(new Date());
    
    // 캐시 업데이트
    const userId = localStorage.getItem('userId');
    if (userId) {
      const cacheKey = getCacheKey.hearts(userId);
      cacheAPI.cacheManager.set(cacheKey, { hearts: newHearts });
    }
  }, []);

  // 전역 하트 변경 이벤트 리스너
  useEffect(() => {
    const handleHeartBalanceChanged = (event) => {
      const { newBalance, change, reason } = event.detail;
      
      console.log(`💖 하트 잔액 변경: ${hearts} → ${newBalance} (${change > 0 ? '+' : ''}${change})`);
      
      setHearts(newBalance);
      setLastUpdated(new Date());
      
      // 변경 사유가 있으면 에러 상태 클리어
      if (reason) {
        setError(null);
      }
    };

    window.addEventListener('hearts:balanceChanged', handleHeartBalanceChanged);

    return () => {
      window.removeEventListener('hearts:balanceChanged', handleHeartBalanceChanged);
    };
  }, [hearts]);

  // 초기 하트 잔액 로드
  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      fetchHearts();
    }
  }, [fetchHearts]);

  // 주기적 하트 잔액 동기화 (5분마다)
  useEffect(() => {
    const interval = setInterval(() => {
      const userId = localStorage.getItem('userId');
      if (userId && !loading) {
        fetchHearts();
      }
    }, 5 * 60 * 1000); // 5분

    return () => clearInterval(interval);
  }, [fetchHearts, loading]);

  return {
    // 상태
    hearts,
    loading,
    error,
    lastUpdated,
    
    // 액션
    fetchHearts,
    spendHearts,
    chargeHearts,
    updateHearts,
    
    // 유틸리티
    hasEnoughHearts: (amount) => hearts >= amount,
    isLowOnHearts: hearts < 10,
    isCriticallyLow: hearts < 5,
    
    // 새로고침
    refresh: () => fetchHearts(true)
  };
};

/**
 * 하트 부족 체크 훅
 */
export const useHeartsCheck = (requiredAmount = 1) => {
  const { hearts, hasEnoughHearts } = useHearts();
  
  return {
    canProceed: hasEnoughHearts(requiredAmount),
    hearts,
    requiredAmount,
    shortage: Math.max(0, requiredAmount - hearts)
  };
};

/**
 * 하트 알림 훅
 */
export const useHeartsNotification = () => {
  const { hearts, isLowOnHearts, isCriticallyLow } = useHearts();
  
  const getNotificationMessage = () => {
    if (isCriticallyLow) {
      return '하트가 거의 없습니다! 하트샵에서 충전해주세요.';
    }
    if (isLowOnHearts) {
      return '하트가 부족합니다. 곧 충전해주세요.';
    }
    return null;
  };

  const getNotificationLevel = () => {
    if (isCriticallyLow) return 'critical';
    if (isLowOnHearts) return 'warning';
    return 'normal';
  };

  return {
    hearts,
    shouldShowNotification: isLowOnHearts,
    notificationMessage: getNotificationMessage(),
    notificationLevel: getNotificationLevel()
  };
};

export default useHearts; 