// Google OAuth 설정
export const GOOGLE_CONFIG = {
  // 웹 클라이언트 ID (Google Cloud Console에서 생성)
  WEB_CLIENT_ID: '869338406740-m1uqc1s7uuvh7jv3kfbf9gvdqj8nqh4f.apps.googleusercontent.com',
  
  // Android 클라이언트 ID (Google Cloud Console에서 생성)
  // SHA-1 인증서와 패키지명으로 생성한 Android OAuth 클라이언트 ID
  ANDROID_CLIENT_ID: '869338406740-your-android-client-id.apps.googleusercontent.com',
  
  // iOS 클라이언트 ID (필요시 추가)
  IOS_CLIENT_ID: '869338406740-your-ios-client-id.apps.googleusercontent.com',
  
  // 스코프 설정
  SCOPES: ['openid', 'profile', 'email'],
  
  // 네이티브 Google Sign-In 추가 설정
  OFFLINE_ACCESS: true,
  HOSTED_DOMAIN: '',
  LOGIN_HINT: '',
  INCLUDE_GRANTED_SCOPES: true,
  FORCE_CODE_FOR_REFRESH_TOKEN: true,
  ACCOUNT_NAME: '',
  ACCOUNT_PROMPT: 'select_account',
  PROFILE_IMAGE_SIZE: 120,
}; 