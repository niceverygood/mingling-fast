import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

function App(): React.JSX.Element {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const handleLoadStart = () => {
    console.log('🚀 Starting to load minglingchat.com...');
    setLoading(true);
    setError('');
  };

  const handleLoadEnd = () => {
    console.log('✅ Successfully loaded minglingchat.com');
    setLoading(false);
  };

  const handleError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ WebView error:', nativeEvent);
    setError(`연결 오류: ${nativeEvent.description || '알 수 없는 오류'}`);
    setLoading(false);
  };

  const handleHttpError = (syntheticEvent: any) => {
    const { nativeEvent } = syntheticEvent;
    console.error('❌ HTTP error:', nativeEvent);
    setError(`HTTP 오류 ${nativeEvent.statusCode}: 서버에 연결할 수 없습니다`);
    setLoading(false);
  };

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ 연결 오류</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Text style={styles.errorSubtext}>
            인터넷 연결을 확인하고 앱을 다시 시작해주세요.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      {loading && (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>밍글링챗 로딩 중...</Text>
        </View>
      )}
      <WebView
        source={{ uri: 'https://www.minglingchat.com' }}
        style={styles.webview}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
        onHttpError={handleHttpError}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        userAgent="Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    fontSize: 18,
    color: '#333333',
    fontWeight: '500',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e74c3c',
    marginBottom: 16,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginBottom: 12,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
});

export default App; 