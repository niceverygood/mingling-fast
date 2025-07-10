import React, { useState, useEffect } from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar, Alert } from 'react-native';
import { WebView } from 'react-native-webview';
import AsyncStorage from '@react-native-async-storage/async-storage';
import GoogleOAuth from './components/GoogleOAuth';
import AuthService from './services/authService';

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authToken, setAuthToken] = useState(null);

  // 앱 시작 시 로그인 상태 복원
  useEffect(() => {
    checkLoginStatus();
  }, []);

  // 저장된 로그인 상태 확인
  const checkLoginStatus = async () => {
    try {
      const savedUser = await AsyncStorage.getItem('user');
      const savedToken = await AsyncStorage.getItem('authToken');
      
      if (savedUser && savedToken) {
        const userData = JSON.parse(savedUser);
        console.log('💾 저장된 로그인 상태 복원:', userData);
        
        // 토큰 유효성 검사
        const isValidToken = await AuthService.verifyToken(savedToken);
        
        if (isValidToken) {
          setUser(userData);
          setAuthToken(savedToken);
          console.log('✅ 로그인 상태 복원 성공');
        } else {
          console.log('⚠️ 토큰 만료됨, 다시 로그인 필요');
          await clearLoginData();
        }
      }
    } catch (error) {
      console.error('❌ 로그인 상태 확인 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  // 로그인 데이터 저장
  const saveLoginData = async (userData, token) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('authToken', token);
      console.log('💾 로그인 데이터 저장 완료');
    } catch (error) {
      console.error('❌ 로그인 데이터 저장 실패:', error);
    }
  };

  // 로그인 데이터 삭제
  const clearLoginData = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('authToken');
      setUser(null);
      setAuthToken(null);
      console.log('🗑️ 로그인 데이터 삭제 완료');
    } catch (error) {
      console.error('❌ 로그인 데이터 삭제 실패:', error);
    }
  };

  // Google OAuth 로그인 성공 처리
  const handleLoginSuccess = async (googleUser) => {
    try {
      console.log('🎉 Google OAuth 성공:', googleUser);
      
      // 백엔드 로그인 처리
      const backendResult = await AuthService.loginWithGoogle(googleUser);
      
      if (backendResult.success) {
        setUser(backendResult.user);
        setAuthToken(backendResult.token);
        
        // 로그인 정보 저장
        await saveLoginData(backendResult.user, backendResult.token);
        
        Alert.alert('로그인 성공', `안녕하세요, ${backendResult.user.username}님!`);
      } else {
        Alert.alert('로그인 오류', backendResult.error || '백엔드 로그인에 실패했습니다.');
      }
    } catch (error) {
      console.error('❌ 로그인 처리 실패:', error);
      Alert.alert('로그인 오류', '로그인 처리 중 오류가 발생했습니다.');
    }
  };

  // Google OAuth 로그인 실패 처리
  const handleLoginError = (error) => {
    console.error('❌ Google OAuth 실패:', error);
    Alert.alert('로그인 오류', 'Google 로그인에 실패했습니다.');
  };

  // 로그아웃 처리
  const handleLogout = async () => {
    try {
      await AuthService.logout();
      await clearLoginData();
      Alert.alert('로그아웃', '로그아웃되었습니다.');
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error);
      Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
    }
  };

  // WebView에서 메시지 처리 (하트 업데이트 등)
  const handleWebViewMessage = (event) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      console.log('📱 WebView 메시지:', message);
      
      // 하트 업데이트 메시지 처리
      if (message.type === 'HEART_UPDATE' && message.hearts !== undefined) {
        console.log('💖 하트 잔액 업데이트:', message.hearts);
        // 필요시 로컬 상태 업데이트
      }
      
      // 로그아웃 메시지 처리
      if (message.type === 'LOGOUT') {
        console.log('🚪 WebView에서 로그아웃 요청');
        handleLogout();
      }
    } catch (error) {
      console.log('📱 WebView 일반 메시지:', event.nativeEvent.data);
    }
  };

  // 로딩 중
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
        <View style={styles.loadingContainer}>
          {/* 로딩 화면 */}
        </View>
      </SafeAreaView>
    );
  }

  // 로그인되지 않은 경우 OAuth 로그인 화면
  if (!user || !authToken) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
        <GoogleOAuth
          onLoginSuccess={handleLoginSuccess}
          onLoginError={handleLoginError}
        />
      </SafeAreaView>
    );
  }

  // 로그인된 경우 WebView 표시
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <WebView
        source={{ 
          uri: 'https://www.minglingchat.com',
          headers: {
            'X-User-ID': user.id,
            'X-User-Email': user.email,
            'Authorization': `Bearer ${authToken}`,
          }
        }}
        style={styles.webview}
        // 기본 설정
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
        
        // OAuth 웹 기반 처리를 위한 설정
        userAgent="Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Mobile Safari/537.36 MinglingApp/1.0"
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        setSupportMultipleWindows={false}
        
        // 이벤트 핸들러
        onError={(error) => console.log('WebView error:', error)}
        onLoad={() => console.log('WebView loaded successfully')}
        onMessage={handleWebViewMessage}
        
        // 사용자 정보를 WebView에 주입
        injectedJavaScript={`
          window.ReactNativeWebView = {
            postMessage: (data) => window.ReactNativeWebView.postMessage(data)
          };
          
          // 사용자 정보를 전역 변수로 설정
          window.NATIVE_USER_INFO = {
            id: '${user.id}',
            email: '${user.email}',
            username: '${user.username}',
            hearts: ${user.hearts || 0},
            authToken: '${authToken}'
          };
          
          // 네이티브 앱임을 알리는 플래그
          window.IS_NATIVE_APP = true;
          
          console.log('🏠 네이티브 앱에서 로그인됨:', window.NATIVE_USER_INFO);
          true;
        `}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6366f1',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
