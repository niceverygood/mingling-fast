// 백엔드 API 기본 URL
const API_BASE_URL = 'https://api.minglingchat.com';

class AuthService {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  // 사용자 정보 저장/로그인
  async loginWithGoogle(googleUserData) {
    try {
      console.log('🔐 백엔드 로그인 시도:', googleUserData);
      
      const response = await fetch(`${this.baseUrl}/api/users/profile`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': googleUserData.id,
          'x-user-email': googleUserData.email,
          'Authorization': `Bearer ${googleUserData.idToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const userData = await response.json();
      console.log('✅ 백엔드 로그인 성공:', userData);
      
      return {
        success: true,
        user: userData,
        token: googleUserData.idToken,
      };
    } catch (error) {
      console.error('❌ 백엔드 로그인 실패:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // 사용자 하트 잔액 조회
  async getUserHearts(userId, token) {
    try {
      const response = await fetch(`${this.baseUrl}/api/hearts/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ 하트 잔액 조회 실패:', error);
      throw error;
    }
  }

  // 토큰 검증
  async verifyToken(token) {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ 토큰 검증 실패:', error);
      return false;
    }
  }

  // 로그아웃
  async logout() {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      return false;
    }
  }
}

export default new AuthService(); 