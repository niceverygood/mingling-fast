/**
 * 모니터링 및 성능 추적 유틸리티
 */

// 성능 메트릭 수집
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoads: [],
      apiCalls: [],
      userActions: [],
      errors: [],
      resourceLoading: []
    };
    
    this.observers = new Map();
    this.isEnabled = process.env.NODE_ENV === 'production' || process.env.REACT_APP_ENABLE_MONITORING === 'true';
    
    if (this.isEnabled) {
      this.initializeObservers();
    }
  }

  // 옵저버 초기화
  initializeObservers() {
    // Performance Observer for navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordPageLoad(entry);
          }
        });
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.set('navigation', navObserver);

        // Resource loading observer
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordResourceLoad(entry);
          }
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.set('resource', resourceObserver);

        // Largest Contentful Paint observer
        const lcpObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordLCP(entry);
          }
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.set('lcp', lcpObserver);

        // First Input Delay observer
        const fidObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordFID(entry);
          }
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.set('fid', fidObserver);

      } catch (error) {
        console.warn('Performance Observer 초기화 실패:', error);
      }
    }

    // Intersection Observer for visibility tracking
    if ('IntersectionObserver' in window) {
      const visibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          this.recordVisibility(entry);
        });
      }, { threshold: [0.1, 0.5, 0.9] });
      
      this.observers.set('visibility', visibilityObserver);
    }
  }

  // 페이지 로드 성능 기록
  recordPageLoad(entry) {
    const metrics = {
      timestamp: Date.now(),
      url: entry.name,
      loadTime: entry.loadEventEnd - entry.loadEventStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      firstPaint: this.getFirstPaint(),
      firstContentfulPaint: this.getFirstContentfulPaint(),
      timeToInteractive: this.calculateTTI(entry),
      transferSize: entry.transferSize,
      encodedBodySize: entry.encodedBodySize
    };

    this.metrics.pageLoads.push(metrics);
    this.sendMetrics('pageLoad', metrics);
  }

  // 리소스 로딩 성능 기록
  recordResourceLoad(entry) {
    if (entry.duration > 1000) { // 1초 이상 걸린 리소스만 기록
      const metrics = {
        timestamp: Date.now(),
        name: entry.name,
        type: entry.initiatorType,
        duration: entry.duration,
        transferSize: entry.transferSize,
        encodedBodySize: entry.encodedBodySize
      };

      this.metrics.resourceLoading.push(metrics);
      
      if (entry.duration > 3000) { // 3초 이상은 경고
        console.warn('🐌 느린 리소스 로딩:', metrics);
      }
    }
  }

  // LCP (Largest Contentful Paint) 기록
  recordLCP(entry) {
    const metrics = {
      timestamp: Date.now(),
      value: entry.startTime,
      element: entry.element?.tagName || 'unknown'
    };

    if (entry.startTime > 2500) { // 2.5초 이상은 경고
      console.warn('🐌 느린 LCP:', metrics);
    }

    this.sendMetrics('lcp', metrics);
  }

  // FID (First Input Delay) 기록
  recordFID(entry) {
    const metrics = {
      timestamp: Date.now(),
      value: entry.processingStart - entry.startTime,
      eventType: entry.name
    };

    if (metrics.value > 100) { // 100ms 이상은 경고
      console.warn('🐌 느린 FID:', metrics);
    }

    this.sendMetrics('fid', metrics);
  }

  // 가시성 추적
  recordVisibility(entry) {
    const element = entry.target;
    const elementInfo = {
      tagName: element.tagName,
      className: element.className,
      id: element.id
    };

    if (entry.isIntersecting) {
      this.recordUserAction('element_visible', elementInfo);
    }
  }

  // API 호출 성능 기록
  recordAPICall(url, method, duration, status, error = null) {
    const metrics = {
      timestamp: Date.now(),
      url,
      method,
      duration,
      status,
      error: error ? {
        message: error.message,
        type: error.name
      } : null
    };

    this.metrics.apiCalls.push(metrics);

    // 느린 API 호출 경고
    if (duration > 5000) {
      console.warn('🐌 느린 API 호출:', metrics);
    }

    // 에러 발생 시 에러 추적
    if (error) {
      this.recordError(error, { context: 'api_call', url, method });
    }

    this.sendMetrics('apiCall', metrics);
  }

  // 사용자 액션 기록
  recordUserAction(action, data = {}) {
    const metrics = {
      timestamp: Date.now(),
      action,
      data,
      url: window.location.pathname,
      userId: localStorage.getItem('userId')
    };

    this.metrics.userActions.push(metrics);
    this.sendMetrics('userAction', metrics);
  }

  // 에러 기록
  recordError(error, context = {}) {
    const errorMetrics = {
      timestamp: Date.now(),
      message: error.message,
      stack: error.stack,
      type: error.name,
      url: window.location.pathname,
      userAgent: navigator.userAgent,
      userId: localStorage.getItem('userId'),
      context
    };

    this.metrics.errors.push(errorMetrics);
    
    // 콘솔에 에러 로그
    console.error('🚨 에러 발생:', errorMetrics);

    this.sendMetrics('error', errorMetrics);
  }

  // 성능 지표 계산 헬퍼
  getFirstPaint() {
    const entry = performance.getEntriesByName('first-paint')[0];
    return entry ? entry.startTime : null;
  }

  getFirstContentfulPaint() {
    const entry = performance.getEntriesByName('first-contentful-paint')[0];
    return entry ? entry.startTime : null;
  }

  calculateTTI(navEntry) {
    // 간단한 TTI 계산 (실제로는 더 복잡한 알고리즘 필요)
    return navEntry.loadEventEnd;
  }

  // 메트릭 전송
  sendMetrics(type, data) {
    if (!this.isEnabled) return;

    // 개발 환경에서는 콘솔에만 출력
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 ${type}:`, data);
      return;
    }

    // 프로덕션에서는 실제 모니터링 서비스로 전송
    this.sendToMonitoringService(type, data);
  }

  // 모니터링 서비스로 전송 (예: Sentry, DataDog 등)
  async sendToMonitoringService(type, data) {
    try {
      // 배치 전송을 위해 큐에 추가
      this.addToQueue(type, data);
      
      // 큐가 가득 차거나 일정 시간이 지나면 전송
      if (this.shouldFlushQueue()) {
        await this.flushQueue();
      }
    } catch (error) {
      console.warn('모니터링 데이터 전송 실패:', error);
    }
  }

  // 큐 관리
  addToQueue(type, data) {
    if (!this.queue) {
      this.queue = [];
      this.lastFlush = Date.now();
    }

    this.queue.push({ type, data, timestamp: Date.now() });
  }

  shouldFlushQueue() {
    if (!this.queue) return false;
    
    const queueSize = this.queue.length;
    const timeSinceLastFlush = Date.now() - this.lastFlush;
    
    return queueSize >= 50 || timeSinceLastFlush >= 30000; // 50개 또는 30초
  }

  async flushQueue() {
    if (!this.queue || this.queue.length === 0) return;

    const dataToSend = [...this.queue];
    this.queue = [];
    this.lastFlush = Date.now();

    // 실제 모니터링 서비스 API 호출
    // 예: Sentry, DataDog, 자체 서버 등
    if (window.gtag) {
      // Google Analytics 4 이벤트 전송
      dataToSend.forEach(({ type, data }) => {
        window.gtag('event', type, data);
      });
    }
  }

  // 통계 조회
  getStats() {
    return {
      pageLoads: this.metrics.pageLoads.length,
      apiCalls: this.metrics.apiCalls.length,
      userActions: this.metrics.userActions.length,
      errors: this.metrics.errors.length,
      resourceLoading: this.metrics.resourceLoading.length,
      avgApiResponseTime: this.calculateAvgApiResponseTime(),
      errorRate: this.calculateErrorRate()
    };
  }

  calculateAvgApiResponseTime() {
    if (this.metrics.apiCalls.length === 0) return 0;
    
    const totalTime = this.metrics.apiCalls.reduce((sum, call) => sum + call.duration, 0);
    return totalTime / this.metrics.apiCalls.length;
  }

  calculateErrorRate() {
    const totalApiCalls = this.metrics.apiCalls.length;
    const failedCalls = this.metrics.apiCalls.filter(call => call.error).length;
    
    return totalApiCalls > 0 ? (failedCalls / totalApiCalls) * 100 : 0;
  }

  // 정리
  destroy() {
    this.observers.forEach(observer => {
      observer.disconnect();
    });
    this.observers.clear();
    
    if (this.queue && this.queue.length > 0) {
      this.flushQueue();
    }
  }
}

// 글로벌 에러 핸들러
class GlobalErrorHandler {
  constructor(monitor) {
    this.monitor = monitor;
    this.setupErrorHandlers();
  }

  setupErrorHandlers() {
    // JavaScript 에러 처리
    window.addEventListener('error', (event) => {
      this.monitor.recordError(event.error || new Error(event.message), {
        type: 'javascript',
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
    });

    // Promise rejection 처리
    window.addEventListener('unhandledrejection', (event) => {
      this.monitor.recordError(
        event.reason instanceof Error ? event.reason : new Error(event.reason),
        { type: 'unhandled_promise_rejection' }
      );
    });

    // React 에러 경계를 위한 전역 에러 이벤트
    window.addEventListener('react:error', (event) => {
      this.monitor.recordError(event.detail.error, {
        type: 'react_error',
        componentStack: event.detail.componentStack
      });
    });
  }
}

// 싱글톤 인스턴스
const performanceMonitor = new PerformanceMonitor();
const globalErrorHandler = new GlobalErrorHandler(performanceMonitor);

// 페이지 언로드 시 정리
window.addEventListener('beforeunload', () => {
  performanceMonitor.destroy();
});

// 내보내기
export { performanceMonitor, GlobalErrorHandler };
export default performanceMonitor; 