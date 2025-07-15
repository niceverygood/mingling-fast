/**
 * 캐싱 유틸리티
 * 메모리 캐시와 localStorage를 활용한 다층 캐싱 시스템
 */

// 캐시 설정
const CACHE_CONFIG = {
  DEFAULT_TTL: 5 * 60 * 1000, // 5분
  MAX_MEMORY_SIZE: 50, // 메모리 캐시 최대 항목 수
  MAX_STORAGE_SIZE: 100, // localStorage 캐시 최대 항목 수
  STORAGE_PREFIX: 'mingling_cache_'
};

// 메모리 캐시
class MemoryCache {
  constructor(maxSize = CACHE_CONFIG.MAX_MEMORY_SIZE) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  set(key, data, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    // 크기 제한 확인
    if (this.cache.size >= this.maxSize) {
      // LRU 방식으로 가장 오래된 항목 제거
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // TTL 확인
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    // LRU 업데이트를 위해 재삽입
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.data;
  }

  delete(key) {
    return this.cache.delete(key);
  }

  clear() {
    this.cache.clear();
  }

  has(key) {
    const item = this.cache.get(key);
    if (!item) return false;

    // TTL 확인
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  size() {
    return this.cache.size;
  }

  // 만료된 항목들 정리
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// localStorage 캐시
class StorageCache {
  constructor(maxSize = CACHE_CONFIG.MAX_STORAGE_SIZE) {
    this.maxSize = maxSize;
    this.prefix = CACHE_CONFIG.STORAGE_PREFIX;
  }

  _getKey(key) {
    return `${this.prefix}${key}`;
  }

  _getAllCacheKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.prefix)) {
        keys.push(key);
      }
    }
    return keys;
  }

  set(key, data, ttl = CACHE_CONFIG.DEFAULT_TTL) {
    try {
      // 크기 제한 확인
      const cacheKeys = this._getAllCacheKeys();
      if (cacheKeys.length >= this.maxSize) {
        // 가장 오래된 항목 제거
        let oldestKey = null;
        let oldestTime = Date.now();

        for (const cacheKey of cacheKeys) {
          try {
            const item = JSON.parse(localStorage.getItem(cacheKey));
            if (item && item.timestamp < oldestTime) {
              oldestTime = item.timestamp;
              oldestKey = cacheKey;
            }
          } catch (e) {
            // 파싱 에러 시 해당 항목 삭제
            localStorage.removeItem(cacheKey);
          }
        }

        if (oldestKey) {
          localStorage.removeItem(oldestKey);
        }
      }

      const item = {
        data,
        timestamp: Date.now(),
        ttl
      };

      localStorage.setItem(this._getKey(key), JSON.stringify(item));
    } catch (error) {
      console.warn('localStorage 캐시 저장 실패:', error);
      // localStorage가 가득 찬 경우 일부 항목 정리
      this.cleanup();
    }
  }

  get(key) {
    try {
      const item = localStorage.getItem(this._getKey(key));
      if (!item) return null;

      const parsed = JSON.parse(item);
      
      // TTL 확인
      if (Date.now() - parsed.timestamp > parsed.ttl) {
        localStorage.removeItem(this._getKey(key));
        return null;
      }

      return parsed.data;
    } catch (error) {
      console.warn('localStorage 캐시 읽기 실패:', error);
      localStorage.removeItem(this._getKey(key));
      return null;
    }
  }

  delete(key) {
    localStorage.removeItem(this._getKey(key));
  }

  clear() {
    const cacheKeys = this._getAllCacheKeys();
    cacheKeys.forEach(key => localStorage.removeItem(key));
  }

  has(key) {
    return this.get(key) !== null;
  }

  // 만료된 항목들 정리
  cleanup() {
    const now = Date.now();
    const cacheKeys = this._getAllCacheKeys();

    for (const cacheKey of cacheKeys) {
      try {
        const item = JSON.parse(localStorage.getItem(cacheKey));
        if (!item || now - item.timestamp > item.ttl) {
          localStorage.removeItem(cacheKey);
        }
      } catch (e) {
        localStorage.removeItem(cacheKey);
      }
    }
  }
}

// 통합 캐시 클래스
class CacheManager {
  constructor() {
    this.memoryCache = new MemoryCache();
    this.storageCache = new StorageCache();
    
    // 주기적 정리 (5분마다)
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 5 * 60 * 1000);
  }

  set(key, data, options = {}) {
    const {
      ttl = CACHE_CONFIG.DEFAULT_TTL,
      memoryOnly = false,
      storageOnly = false
    } = options;

    if (!storageOnly) {
      this.memoryCache.set(key, data, ttl);
    }

    if (!memoryOnly) {
      this.storageCache.set(key, data, ttl);
    }
  }

  get(key) {
    // 메모리 캐시에서 먼저 확인
    let data = this.memoryCache.get(key);
    if (data !== null) {
      return data;
    }

    // localStorage 캐시에서 확인
    data = this.storageCache.get(key);
    if (data !== null) {
      // 메모리 캐시에도 저장 (자주 사용되는 데이터)
      this.memoryCache.set(key, data);
      return data;
    }

    return null;
  }

  delete(key) {
    this.memoryCache.delete(key);
    this.storageCache.delete(key);
  }

  clear() {
    this.memoryCache.clear();
    this.storageCache.clear();
  }

  has(key) {
    return this.memoryCache.has(key) || this.storageCache.has(key);
  }

  cleanup() {
    this.memoryCache.cleanup();
    this.storageCache.cleanup();
  }

  // 캐시 통계
  getStats() {
    return {
      memorySize: this.memoryCache.size(),
      storageSize: this.storageCache._getAllCacheKeys().length,
      maxMemorySize: this.memoryCache.maxSize,
      maxStorageSize: this.storageCache.maxSize
    };
  }

  // 소멸자
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

// 싱글톤 인스턴스
const cacheManager = new CacheManager();

// API 응답 캐싱을 위한 헬퍼 함수들
export const cacheAPI = {
  // API 응답 캐싱
  async cachedFetch(key, fetchFunction, options = {}) {
    const {
      ttl = CACHE_CONFIG.DEFAULT_TTL,
      forceRefresh = false,
      ...cacheOptions
    } = options;

    // 강제 새로고침이 아닌 경우 캐시 확인
    if (!forceRefresh) {
      const cached = cacheManager.get(key);
      if (cached !== null) {
        console.log(`📦 캐시에서 데이터 반환: ${key}`);
        return cached;
      }
    }

    try {
      console.log(`🔄 API 호출 및 캐싱: ${key}`);
      const data = await fetchFunction();
      
      // 성공한 응답만 캐싱
      if (data) {
        cacheManager.set(key, data, { ttl, ...cacheOptions });
      }
      
      return data;
    } catch (error) {
      // 에러 발생 시 캐시된 데이터가 있으면 반환 (stale-while-revalidate)
      const staleData = cacheManager.get(key);
      if (staleData !== null) {
        console.warn(`⚠️ API 에러, 캐시된 데이터 반환: ${key}`, error);
        return staleData;
      }
      
      throw error;
    }
  },

  // 캐시 무효화
  invalidate(pattern) {
    if (typeof pattern === 'string') {
      cacheManager.delete(pattern);
    } else if (pattern instanceof RegExp) {
      // 패턴 매칭으로 여러 키 삭제
      const memoryKeys = Array.from(cacheManager.memoryCache.cache.keys());
      const storageKeys = cacheManager.storageCache._getAllCacheKeys()
        .map(key => key.replace(cacheManager.storageCache.prefix, ''));
      
      const allKeys = [...new Set([...memoryKeys, ...storageKeys])];
      
      allKeys.forEach(key => {
        if (pattern.test(key)) {
          cacheManager.delete(key);
        }
      });
    }
  },

  // 특정 타입의 캐시 무효화
  invalidateByType(type) {
    this.invalidate(new RegExp(`^${type}_`));
  }
};

// 자주 사용되는 캐시 키 생성 함수들
export const getCacheKey = {
  user: (userId) => `user_${userId}`,
  character: (characterId) => `character_${characterId}`,
  characters: (userId, filters = {}) => {
    const filterStr = Object.keys(filters).length > 0 ? 
      '_' + Object.entries(filters).map(([k, v]) => `${k}:${v}`).join('_') : '';
    return `characters_${userId}${filterStr}`;
  },
  chat: (chatId) => `chat_${chatId}`,
  messages: (chatId, page = 1) => `messages_${chatId}_page_${page}`,
  hearts: (userId) => `hearts_${userId}`,
  favorability: (userId, characterId) => `favorability_${userId}_${characterId}`
};

// 페이지 언로드 시 정리
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cacheManager.destroy();
  });
}

export { cacheManager };
export default cacheAPI; 