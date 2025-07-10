// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, signOut, getRedirectResult } from "firebase/auth";

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

// Google Sign In - WebView 환경 지원
export const signInWithGoogle = async () => {
  try {
    // WebView 환경에서는 redirect 방식 사용
    const isWebView = window.navigator.userAgent.includes('WebView') || 
                      window.navigator.userAgent.includes('wv') ||
                      window.ReactNativeWebView !== undefined;
    
    if (isWebView) {
      // WebView 환경에서는 redirect 사용
      await signInWithRedirect(auth, googleProvider);
      return { success: true, message: 'Redirecting to Google login...' };
    } else {
      // 일반 웹 환경에서는 popup 사용
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

// Handle Redirect Result (for WebView environments)
export const handleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
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
    } else {
      return {
        success: false,
        error: 'No redirect result found'
      };
    }
  } catch (error) {
    console.error('Handle redirect result error:', error);
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