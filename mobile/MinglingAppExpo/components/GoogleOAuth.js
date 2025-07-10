import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GOOGLE_CONFIG } from '../config/googleAuth';

// WebBrowser 결과 완료 처리
WebBrowser.maybeCompleteAuthSession();

const GoogleOAuth = ({ onLoginSuccess, onLoginError }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  // OAuth 요청 설정
  const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/oauth/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
  };

  // OAuth 설정
  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CONFIG.WEB_CLIENT_ID,
      scopes: GOOGLE_CONFIG.SCOPES,
      redirectUri: AuthSession.makeRedirectUri({
        scheme: 'com.anonymous.MinglingAppExpo',
        path: 'auth'
      }),
      responseType: AuthSession.ResponseType.Code,
      additionalParameters: {
        access_type: 'offline',
        prompt: 'select_account',
      },
      extraParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
    discovery
  );

  // OAuth 응답 처리
  useEffect(() => {
    if (response?.type === 'success') {
      const { code } = response.params;
      if (code) {
        handleGoogleLogin(code);
      }
    } else if (response?.type === 'error') {
      console.error('OAuth Error:', response.error);
      if (onLoginError) {
        onLoginError(response.error);
      }
    }
  }, [response]);

  // 구글 로그인 처리
  const handleGoogleLogin = async (code) => {
    setLoading(true);
    
    try {
      console.log('🔐 Google OAuth Code 받음:', code);
      
      // 1. 코드를 사용하여 토큰 교환
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code: code,
          client_id: GOOGLE_CONFIG.WEB_CLIENT_ID,
          client_secret: '', // 네이티브 앱에서는 클라이언트 시크릿 없음
          redirect_uri: AuthSession.makeRedirectUri({
            scheme: 'com.anonymous.MinglingAppExpo',
            path: 'auth'
          }),
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('🎟️ 토큰 응답:', tokenData);

      if (tokenData.access_token) {
        // 2. 액세스 토큰으로 사용자 정보 가져오기
        await fetchUserInfo(tokenData.access_token, tokenData.id_token);
      } else {
        throw new Error('토큰 획득 실패');
      }
    } catch (error) {
      console.error('❌ Google 로그인 실패:', error);
      Alert.alert('로그인 오류', error.message);
      if (onLoginError) {
        onLoginError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 사용자 정보 가져오기
  const fetchUserInfo = async (accessToken, idToken) => {
    try {
      const userResponse = await fetch(
        `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${accessToken}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const userData = await userResponse.json();
      console.log('👤 사용자 정보:', userData);

      const user = {
        id: userData.id,
        email: userData.email,
        name: userData.name,
        picture: userData.picture,
        accessToken: accessToken,
        idToken: idToken,
      };

      setUser(user);
      
      if (onLoginSuccess) {
        onLoginSuccess(user);
      }
    } catch (error) {
      console.error('❌ 사용자 정보 가져오기 실패:', error);
      throw error;
    }
  };

  // 로그아웃
  const handleLogout = () => {
    setUser(null);
    Alert.alert('로그아웃', '로그아웃되었습니다.');
  };

  // 로그인 버튼 클릭
  const handleLogin = () => {
    if (!request) {
      Alert.alert('오류', '로그인을 준비 중입니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    
    promptAsync();
  };

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>로그인 성공!</Text>
        <Text style={styles.userInfo}>이름: {user.name}</Text>
        <Text style={styles.userInfo}>이메일: {user.email}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>밍글링 로그인</Text>
      <Text style={styles.subtitle}>Google 계정으로 로그인해주세요</Text>
      
      <TouchableOpacity
        style={[styles.loginButton, loading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={loading || !request}
      >
        <Text style={styles.loginButtonText}>
          {loading ? '로그인 중...' : '🔐 Google로 로그인'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.infoText}>
        네이티브 Google OAuth를 사용하여 안전하게 로그인합니다.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 200,
  },
  loginButtonDisabled: {
    backgroundColor: '#ccc',
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  logoutButton: {
    backgroundColor: '#ff4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  logoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userInfo: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default GoogleOAuth; 