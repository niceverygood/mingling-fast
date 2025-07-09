/**
 * 백엔드 검증 유틸리티 함수들
 */

/**
 * 필수 필드 검증
 */
const validateRequired = (fields, data) => {
  const missing = [];
  
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && !data[field].trim())) {
      missing.push(field);
    }
  }
  
  return missing.length > 0 ? `Required fields missing: ${missing.join(', ')}` : null;
};

/**
 * 문자열 길이 검증
 */
const validateLength = (field, value, min = 0, max = Infinity) => {
  if (!value) return null;
  
  const length = value.toString().length;
  if (length < min) {
    return `${field} must be at least ${min} characters long`;
  }
  if (length > max) {
    return `${field} must be no more than ${max} characters long`;
  }
  return null;
};

/**
 * 이메일 형식 검증
 */
const validateEmail = (email) => {
  if (!email) return null;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) ? null : 'Invalid email format';
};

/**
 * UUID 형식 검증
 */
const validateUUID = (id) => {
  if (!id) return 'ID is required';
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id) ? null : 'Invalid ID format';
};

/**
 * 숫자 범위 검증
 */
const validateRange = (field, value, min, max) => {
  const num = Number(value);
  if (isNaN(num)) {
    return `${field} must be a number`;
  }
  if (num < min || num > max) {
    return `${field} must be between ${min} and ${max}`;
  }
  return null;
};

/**
 * 캐릭터 데이터 검증
 */
const validateCharacterData = (data) => {
  const errors = [];
  
  // 필수 필드 검증
  const requiredError = validateRequired(['name'], data);
  if (requiredError) errors.push(requiredError);
  
  // 이름 길이 검증
  const nameError = validateLength('name', data.name, 1, 15);
  if (nameError) errors.push(nameError);
  
  // 나이 길이 검증
  if (data.age) {
    const ageError = validateLength('age', data.age, 0, 15);
    if (ageError) errors.push(ageError);
  }
  
  // 기타 필드 길이 검증
  if (data.likes) {
    const likesError = validateLength('likes', data.likes, 0, 50);
    if (likesError) errors.push(likesError);
  }
  
  if (data.dislikes) {
    const dislikesError = validateLength('dislikes', data.dislikes, 0, 50);
    if (dislikesError) errors.push(dislikesError);
  }
  
  if (data.firstImpression) {
    const impressionError = validateLength('firstImpression', data.firstImpression, 0, 300);
    if (impressionError) errors.push(impressionError);
  }
  
  if (data.basicSetting) {
    const settingError = validateLength('basicSetting', data.basicSetting, 0, 700);
    if (settingError) errors.push(settingError);
  }
  
  return errors.length > 0 ? errors : null;
};

/**
 * 페르소나 데이터 검증
 */
const validatePersonaData = (data) => {
  const errors = [];
  
  // 필수 필드 검증
  const requiredError = validateRequired(['name'], data);
  if (requiredError) errors.push(requiredError);
  
  // 이름 길이 검증
  const nameError = validateLength('name', data.name, 1, 15);
  if (nameError) errors.push(nameError);
  
  // 나이 길이 검증
  if (data.age) {
    const ageError = validateLength('age', data.age, 0, 15);
    if (ageError) errors.push(ageError);
  }
  
  // 직업 길이 검증
  if (data.job) {
    const jobError = validateLength('job', data.job, 0, 15);
    if (jobError) errors.push(jobError);
  }
  
  // 기본 정보 길이 검증
  if (data.basicInfo) {
    const infoError = validateLength('basicInfo', data.basicInfo, 0, 500);
    if (infoError) errors.push(infoError);
  }
  
  // 습관 길이 검증
  if (data.habits) {
    const habitsError = validateLength('habits', data.habits, 0, 500);
    if (habitsError) errors.push(habitsError);
  }
  
  return errors.length > 0 ? errors : null;
};

/**
 * 하트 거래 데이터 검증
 */
const validateHeartTransaction = (data) => {
  const errors = [];
  
  // 금액 검증
  const amountError = validateRange('amount', data.amount, 1, 1000);
  if (amountError) errors.push(amountError);
  
  return errors.length > 0 ? errors : null;
};

module.exports = {
  validateRequired,
  validateLength,
  validateEmail,
  validateUUID,
  validateRange,
  validateCharacterData,
  validatePersonaData,
  validateHeartTransaction
}; 