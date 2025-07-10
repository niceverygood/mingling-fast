import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import {
  GoogleSignin,
  GoogleSigninButton,
  isErrorWithCode,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { GOOGLE_CONFIG } from '../config/googleAuth';

const GoogleOAuth = ({ onLoginSuccess, onLoginError }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isConfigured, setIsConfigured] = useState(false);

  // Google Sign-In 초기 설정
  useEffect(() => {
    configureGoogleSignIn();
    checkIfSignedIn();
  }, []);

  const configureGoogleSignIn = () => {
    try {
      GoogleSignin.configure({
        webClientId: GOOGLE_CONFIG.WEB_CLIENT_ID,
        androidClientId: GOOGLE_CONFIG.ANDROID_CLIENT_ID,
        iosClientId: GOOGLE_CONFIG.IOS_CLIENT_ID,
        scopes: GOOGLE_CONFIG.SCOPES,
        offlineAccess: true,
        hostedDomain: '',
        accountName: '',
        loginHint: '',
        forceCodeForRefreshToken: true,
        profileImageSize: 120,
      });
      setIsConfigured(true);
      console.log('✅ Google Sign-In 설정 완료');
    } catch (error) {
      console.error('❌ Google Sign-In 설정 실패:', error);
      setIsConfigured(false);
    }
  };

  // 이미 로그인된 사용자 확인
  const checkIfSignedIn = async () => {
    try {
      const isSignedIn = await GoogleSignin.isSignedIn();
      if (isSignedIn) {
        const currentUser = await GoogleSignin.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          console.log('👤 기존 로그인 사용자:', currentUser.user.email);
          if (onLoginSuccess) {
            onLoginSuccess(currentUser);
          }
        }
      }
    } catch (error) {
      console.error('❌ 로그인 상태 확인 실패:', error);
    }
  };

  // 네이티브 Google 로그인
  const handleGoogleLogin = async () => {
    if (!isConfigured) {
      Alert.alert('오류', 'Google Sign-In이 초기화되지 않았습니다.');
      return;
    }

    setLoading(true);
    
    try {
      console.log('🔐 Google 네이티브 로그인 시작');
      
      // 1. Google Play Services 사용 가능 확인
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      // 2. Google 로그인 시도
      const userInfo = await GoogleSignin.signIn();
      console.log('🎉 Google 로그인 성공:', userInfo.user.email);

      // 3. 토큰 가져오기
      const { accessToken, idToken } = await GoogleSignin.getTokens();
      console.log('🎟️ 토큰 획득 성공');

      // 4. 사용자 정보 구성
      const googleUser = {
        id: userInfo.user.id,
        email: userInfo.user.email,
        name: userInfo.user.name,
        picture: userInfo.user.photo,
        familyName: userInfo.user.familyName,
        givenName: userInfo.user.givenName,
        accessToken: accessToken,
        idToken: idToken,
      };

      setUser(userInfo);
      
      if (onLoginSuccess) {
        onLoginSuccess(googleUser);
      }
      
      Alert.alert('로그인 성공', `안녕하세요, ${userInfo.user.name}님!`);
      
    } catch (error) {
      console.error('❌ Google 로그인 실패:', error);
      
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.SIGN_IN_CANCELLED:
            console.log('🚫 사용자가 로그인을 취소했습니다.');
            break;
          case statusCodes.IN_PROGRESS:
            console.log('⏳ 로그인이 진행 중입니다.');
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            Alert.alert('오류', 'Google Play Services가 필요합니다.');
            break;
          default:
            Alert.alert('로그인 오류', '알 수 없는 오류가 발생했습니다.');
        }
      } else {
        Alert.alert('오류', '로그인 중 오류가 발생했습니다.');
      }
      
      if (onLoginError) {
        onLoginError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await GoogleSignin.revokeAccess();
      await GoogleSignin.signOut();
      setUser(null);
      console.log('🚪 로그아웃 완료');
      Alert.alert('로그아웃', '로그아웃되었습니다.');
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
    }
  };

  if (user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>로그인 성공!</Text>
        <Text style={styles.userInfo}>이름: {user.user.name}</Text>
        <Text style={styles.userInfo}>이메일: {user.user.email}</Text>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>로그아웃</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>밍글링 로그인</Text>
      <Text style={styles.subtitle}>네이티브 Google 로그인을 사용해보세요</Text>
      
      <View style={styles.nativeNotice}>
        <Text style={styles.nativeNoticeText}>✅ 완전 네이티브 구현</Text>
        <Text style={styles.nativeNoticeSubtext}>Google 웹뷰 제한 문제 해결!</Text>
      </View>
      
      <GoogleSigninButton
        style={styles.googleButton}
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={handleGoogleLogin}
        disabled={loading || !isConfigured}
      />
      
      <TouchableOpacity
        style={[styles.customButton, (loading || !isConfigured) && styles.customButtonDisabled]}
        onPress={handleGoogleLogin}
        disabled={loading || !isConfigured}
      >
        <Text style={styles.customButtonText}>
          {loading ? '로그인 중...' : '🚀 네이티브 Google 로그인'}
        </Text>
      </TouchableOpacity>
      
      <Text style={styles.infoText}>
        {isConfigured 
          ? '네이티브 Google Sign-In SDK를 사용하여 안전하게 로그인합니다.' 
          : '초기화 중... 잠시만 기다려주세요.'}
      </Text>
      
      <Text style={styles.successText}>
        ✨ 웹뷰 제한 문제 완전 해결!
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
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 28,
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
  nativeNotice: {
    backgroundColor: '#e8f5e8',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  nativeNoticeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    textAlign: 'center',
  },
  nativeNoticeSubtext: {
    fontSize: 14,
    color: '#2e7d32',
    textAlign: 'center',
    marginTop: 5,
  },
  googleButton: {
    width: 250,
    height: 50,
    marginBottom: 15,
  },
  customButton: {
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 8,
    marginBottom: 20,
    minWidth: 250,
  },
  customButtonDisabled: {
    backgroundColor: '#ccc',
  },
  customButtonText: {
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
    marginTop: 15,
  },
  successText: {
    fontSize: 14,
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 10,
    fontWeight: 'bold',
  },
});

export default GoogleOAuth; 