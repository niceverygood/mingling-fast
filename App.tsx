/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Alert,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';

function App(): JSX.Element {
  const [status, setStatus] = React.useState('로딩 중...');

  const handleLoadStart = () => {
    console.log('🚀 Loading started: https://www.minglingchat.com');
    setStatus('웹사이트 로딩 중...');
  };

  const handleLoadEnd = () => {
    console.log('✅ Loading completed successfully!');
    setStatus('로딩 완료');
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView Error:', nativeEvent);
    console.error('❌ Error Details:', {
      url: nativeEvent.url,
      code: nativeEvent.code,
      description: nativeEvent.description,
      domain: nativeEvent.domain
    });
    setStatus(`에러: ${nativeEvent.description}`);
    Alert.alert('WebView 에러', `에러가 발생했습니다: ${nativeEvent.description}`);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('🔴 HTTP Error:', nativeEvent);
    console.error('🔴 HTTP Error Details:', {
      url: nativeEvent.url,
      statusCode: nativeEvent.statusCode,
      description: nativeEvent.description
    });
    setStatus(`HTTP 에러 ${nativeEvent.statusCode}: ${nativeEvent.url}`);
    
    if (nativeEvent.statusCode === 404) {
      console.error('🚨 404 Error - URL not found:', nativeEvent.url);
      Alert.alert('페이지를 찾을 수 없습니다', 
        `URL: ${nativeEvent.url}\n상태코드: ${nativeEvent.statusCode}\n\n다시 시도하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          { text: '다시 시도', onPress: () => {
            console.log('🔄 Reloading WebView...');
            // WebView 새로고침 로직 필요
          }}
        ]
      );
    }
  };

  const handleMessage = (event: any) => {
    console.log('Message from WebView:', event.nativeEvent.data);
  };

  const handleNavigationStateChange = (navState: any) => {
    console.log('Navigation:', navState.url, 'Loading:', navState.loading);
    
    // 404 에러나 잘못된 경로 감지 시 메인 페이지로 리디렉션
    if (navState.url.includes('404') || navState.url.includes('not-found')) {
      console.log('🔄 404 페이지 감지 - 메인 페이지로 리디렉션');
      // WebView를 메인 페이지로 리디렉션하는 로직 필요
      return false;
    }
    
    // 구글 로그인 URL 감지 시 외부 브라우저로 리다이렉트
    if (navState.url.includes('accounts.google.com') && !navState.loading) {
      console.log('🔄 구글 로그인 감지 - 외부 브라우저로 리다이렉트');
      Linking.openURL(navState.url);
      return false; // 네비게이션 중단
    }
  };

  const handleShouldStartLoadWithRequest = (request: any) => {
    console.log('Should start load:', request.url);
    
    // 구글 OAuth URL인 경우 외부 브라우저에서 열기
    if (request.url.includes('accounts.google.com/oauth') || 
        request.url.includes('accounts.google.com/signin')) {
      console.log('🔄 구글 OAuth 감지 - 외부 브라우저로 열기');
      Linking.openURL(request.url);
      return false;
    }
    
    return true;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>상태: {status}</Text>
      </View>

      <WebView
        source={{ uri: 'https://www.minglingchat.com' }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        onMessage={handleMessage}
        onNavigationStateChange={handleNavigationStateChange}
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        incognito={false}
        cacheEnabled={true}
        // 구글 로그인을 위한 개선된 User Agent (Chrome 브라우저로 위장)
        userAgent="Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
        // 구글 로그인 허용을 위한 추가 설정
        mixedContentMode="compatibility"
        allowsBackForwardNavigationGestures={true}
        bounces={false}
        scrollEnabled={true}
        nestedScrollEnabled={true}
        overScrollMode="never"
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        keyboardDisplayRequiresUserAction={false}
        hideKeyboardAccessoryView={false}
        allowsLinkPreview={false}
        allowFileAccess={true}
        saveFormDataDisabled={false}
        pullToRefreshEnabled={true}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  statusBar: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  statusText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  webview: {
    flex: 1,
  },
});

export default App; 