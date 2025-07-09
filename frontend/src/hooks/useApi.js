import { useState, useCallback } from 'react';

/**
 * API 호출을 위한 공통 커스텀 훅
 * @param {Function} apiFunction - 호출할 API 함수
 * @param {Object} options - 옵션 설정
 */
export const useApi = (apiFunction, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const {
    onSuccess,
    onError,
    initialLoading = false,
    resetOnCall = true
  } = options;

  const execute = useCallback(async (...args) => {
    if (resetOnCall) {
      setError(null);
      setData(null);
    }
    
    setLoading(true);

    try {
      const response = await apiFunction(...args);
      const responseData = response?.data || response;
      
      setData(responseData);
      
      if (onSuccess) {
        onSuccess(responseData);
      }
      
      return responseData;
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message || 'Unknown error';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction, onSuccess, onError, resetOnCall]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    loading,
    error,
    execute,
    reset
  };
};

/**
 * 하트 관련 API 호출 훅
 */
export const useHeartApi = () => {
  const [heartBalance, setHeartBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  const updateHeartBalance = useCallback((newBalance) => {
    setHeartBalance(newBalance);
    
    // 로컬 캐시 업데이트
    localStorage.setItem('heartBalance', JSON.stringify({
      hearts: newBalance,
      timestamp: Date.now()
    }));
  }, []);

  return {
    heartBalance,
    loading,
    setLoading,
    updateHeartBalance
  };
};

/**
 * 폼 상태 관리 훅
 */
export const useForm = (initialValues, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = useCallback((name, value) => {
    setValues(prev => ({
      ...prev,
      [name]: value
    }));

    // 실시간 유효성 검사
    if (validationRules[name] && touched[name]) {
      const error = validationRules[name](value);
      setErrors(prev => ({
        ...prev,
        [name]: error
      }));
    }
  }, [validationRules, touched]);

  const setFieldTouched = useCallback((name) => {
    setTouched(prev => ({
      ...prev,
      [name]: true
    }));
  }, []);

  const validate = useCallback(() => {
    const newErrors = {};
    let isValid = true;

    Object.keys(validationRules).forEach(field => {
      const error = validationRules[field](values[field]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [values, validationRules]);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validate,
    reset,
    isValid: Object.keys(errors).length === 0
  };
}; 