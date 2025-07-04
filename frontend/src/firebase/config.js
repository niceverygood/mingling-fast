// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";

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
googleProvider.setCustomParameters({
  client_id: '58613670474-0o4kfs9u048dl4dlsf70o4ososh89v9n.apps.googleusercontent.com'
});

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    console.log('Starting Google sign in...');
    console.log('Auth domain:', firebaseConfig.authDomain);
    console.log('Project ID:', firebaseConfig.projectId);
    
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    console.log('Google sign in successful:', user.email);
    
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
  } catch (error) {
    console.error('Google sign in error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
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