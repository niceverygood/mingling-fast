import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  Alert,
  useColorScheme,
  Button,
} from 'react-native';
import { WebView } from 'react-native-webview';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';
  const [showWebView, setShowWebView] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('App started successfully');
  }, []);

  const handleLoadStart = () => {
    console.log('WebView load started');
    setLoading(true);
    setError(null);
  };

  const handleLoadEnd = () => {
    console.log('WebView load ended');
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView Error:', nativeEvent);
    setError(nativeEvent.description || 'Unknown error');
    setLoading(false);
    Alert.alert('오류', `웹사이트 로딩 중 오류가 발생했습니다: ${nativeEvent.description}`);
  };

  if (!showWebView) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={styles.testContainer}>
          <Text style={styles.title}>🎉 Mingling 앱 작동 중! 🎉</Text>
          <Text style={styles.subtitle}>React Native 앱이 성공적으로 실행되었습니다!</Text>
          <Button 
            title="웹사이트 로드하기" 
            onPress={() => setShowWebView(true)}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Mingling 로딩 중...</Text>
        </View>
      )}
      
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>오류: {error}</Text>
          <Button 
            title="다시 시도" 
            onPress={() => setShowWebView(false)}
          />
        </View>
      )}
      
      <WebView
        source={{ uri: 'https://minglingchat.com' }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        scalesPageToFit={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        onMessage={(event) => {
          console.log('WebView message:', event.nativeEvent.data);
        }}
        onNavigationStateChange={(navState) => {
          console.log('Navigation state changed:', navState);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  testContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
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
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#007AFF',
  },
  errorContainer: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    backgroundColor: '#ffebee',
    padding: 10,
    borderRadius: 5,
    zIndex: 1001,
  },
  errorText: {
    color: '#c62828',
    fontSize: 14,
    marginBottom: 10,
  },
});

export default App; 