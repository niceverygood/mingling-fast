import React from 'react';
import { StyleSheet, View, SafeAreaView, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  // OAuth 리디렉션을 WebView 내에서만 처리하도록 설정
  const handleShouldStartLoadWithRequest = (request) => {
    // Google OAuth나 다른 외부 앱 실행을 차단하고 WebView 내에서만 처리
    console.log('Request URL:', request.url);
    return true; // WebView 내에서 모든 요청 처리
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6366f1" />
      <WebView
        source={{ uri: 'https://www.minglingchat.com' }}
        style={styles.webview}
        // 기본 설정
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsBackForwardNavigationGestures={true}
        
        // OAuth 웹 기반 처리를 위한 설정
        userAgent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        mixedContentMode="compatibility"
        thirdPartyCookiesEnabled={true}
        sharedCookiesEnabled={true}
        setSupportMultipleWindows={false}
        
        // 외부 앱 실행 차단, WebView 내에서만 처리
        onShouldStartLoadWithRequest={handleShouldStartLoadWithRequest}
        
        // 이벤트 핸들러
        onError={(error) => console.log('WebView error:', error)}
        onLoad={() => console.log('WebView loaded successfully')}
        onMessage={(event) => {
          console.log('WebView message:', event.nativeEvent.data);
        }}
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
});
