import React, { useState } from 'react';
import { StyleSheet, View, StatusBar, Text, TouchableOpacity, Alert } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  const [showWebView, setShowWebView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  if (!showWebView) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.welcomeContainer}>
          <Text style={styles.title}>Mingling App</Text>
          <Text style={styles.subtitle}>AI 캐릭터와 채팅하기</Text>
          
          <TouchableOpacity 
            style={styles.button}
            onPress={() => setShowWebView(true)}
          >
            <Text style={styles.buttonText}>앱 시작하기</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, styles.testButton]}
            onPress={() => Alert.alert('테스트', 'Expo 앱이 정상적으로 작동중입니다!')}
          >
            <Text style={styles.buttonText}>테스트</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {isLoading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>minglingchat.com 로딩 중...</Text>
        </View>
      )}
      
      <WebView
        source={{ uri: 'https://minglingchat.com' }}
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        bounces={false}
        allowsBackForwardNavigationGestures={true}
        onLoadStart={() => {
          console.log('웹뷰 로딩 시작');
          setIsLoading(true);
        }}
        onLoadEnd={() => {
          console.log('웹뷰 로딩 완료');
          setIsLoading(false);
        }}
        onError={(error) => {
          console.error('웹뷰 오류:', error);
          Alert.alert('오류', '웹사이트를 로드할 수 없습니다.');
          setIsLoading(false);
        }}
        userAgent="MinglingApp/1.0 (Mobile App)"
      />
      
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => setShowWebView(false)}
      >
        <Text style={styles.backButtonText}>← 뒤로</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  testButton: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  backButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
}); 