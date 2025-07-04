// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithRedirect, getRedirectResult, signOut } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCpGXULewwRPmUiljiFCZcZ25QPMYEVUn4",
  authDomain: "mingling-3f2d5.firebaseapp.com",
  projectId: "mingling-3f2d5",
  storageBucket: "mingling-3f2d5.firebasestorage.app",
  messagingSenderId: "127809706418",
  appId: "1:127809706418:web:97eba244663b84a786ecab",
  measurementId: "G-KYR28WQL23"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// WebView 호환성을 위한 설정
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Google Sign In - WebView 호환성을 위해 redirect 사용
export const signInWithGoogle = async () => {
  try {
    // WebView 환경 감지
    const isWebView = window.ReactNativeWebView !== undefined || 
                     navigator.userAgent.includes('WebView') ||
                     navigator.userAgent.includes('wv');
    
    if (isWebView) {
      // WebView에서는 redirect 사용
      await signInWithRedirect(auth, googleProvider);
      return { success: true, redirected: true };
    } else {
      // 일반 브라우저에서는 popup 사용 (기존 방식)
      const { signInWithPopup } = await import("firebase/auth");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: 'google'
        }
      };
    }
  } catch (error) {
    console.error('Google sign in error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Redirect 결과 처리 (WebView용)
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      const user = result.user;
      return {
        success: true,
        user: {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: 'google'
        }
      };
    }
    return { success: false, noResult: true };
  } catch (error) {
    console.error('Redirect result error:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Sign Out
export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error('Sign out error:', error);
    return { success: false, error: error.message };
  }
};

export { auth, analytics }; 