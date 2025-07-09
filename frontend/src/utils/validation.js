/**
 * 폼 검증 유틸리티 함수들
 */

// 필수 입력 검증
export const required = (message = '필수 입력 항목입니다.') => (value) => {
  return !value || !value.toString().trim() ? message : null;
};

// 최소/최대 길이 검증
export const minLength = (min, message) => (value) => {
  if (!value) return null;
  return value.toString().length < min ? (message || `최소 ${min}자 이상 입력해주세요.`) : null;
};

export const maxLength = (max, message) => (value) => {
  if (!value) return null;
  return value.toString().length > max ? (message || `최대 ${max}자까지 입력 가능합니다.`) : null;
};

// 이메일 형식 검증
export const email = (message = '올바른 이메일 형식을 입력해주세요.') => (value) => {
  if (!value) return null;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !emailRegex.test(value) ? message : null;
};

// 숫자 검증
export const number = (message = '숫자만 입력 가능합니다.') => (value) => {
  if (!value) return null;
  return isNaN(value) ? message : null;
};

// 범위 검증
export const range = (min, max, message) => (value) => {
  if (!value) return null;
  const num = Number(value);
  if (isNaN(num)) return '숫자를 입력해주세요.';
  if (num < min || num > max) {
    return message || `${min}에서 ${max} 사이의 값을 입력해주세요.`;
  }
  return null;
};

// 이미지 URL 검증
export const imageUrl = (message = '올바른 이미지 URL을 입력해주세요.') => (value) => {
  if (!value) return null;
  try {
    const url = new URL(value);
    const validExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const hasValidExtension = validExtensions.some(ext => 
      url.pathname.toLowerCase().includes(ext)
    );
    return hasValidExtension ? null : message;
  } catch {
    return message;
  }
};

// 다중 검증 조합
export const combine = (...validators) => (value) => {
  for (const validator of validators) {
    const error = validator(value);
    if (error) return error;
  }
  return null;
};

// 캐릭터 생성 검증 규칙
export const characterValidationRules = {
  name: combine(
    required('캐릭터 이름은 필수입니다.'),
    maxLength(15, '캐릭터 이름은 15자 이하로 입력해주세요.')
  ),
  age: maxLength(15, '나이는 15자 이하로 입력해주세요.'),
  avatarUrl: required('프로필 이미지는 필수입니다.'),
  characterType: required('캐릭터 카테고리를 선택해주세요.'),
  firstImpression: maxLength(300, '첫인상 설정은 300자 이하로 입력해주세요.'),
  basicSetting: maxLength(700, '기본 설정은 700자 이하로 입력해주세요.'),
  likes: maxLength(50, '좋아하는 것은 50자 이하로 입력해주세요.'),
  dislikes: maxLength(50, '싫어하는 것은 50자 이하로 입력해주세요.')
};

// 페르소나 생성 검증 규칙
export const personaValidationRules = {
  name: combine(
    required('페르소나 이름은 필수입니다.'),
    maxLength(15, '페르소나 이름은 15자 이하로 입력해주세요.')
  ),
  age: maxLength(15, '나이는 15자 이하로 입력해주세요.'),
  job: maxLength(15, '직업은 15자 이하로 입력해주세요.'),
  basicInfo: maxLength(500, '기본 정보는 500자 이하로 입력해주세요.'),
  habits: maxLength(500, '습관 정보는 500자 이하로 입력해주세요.')
}; 