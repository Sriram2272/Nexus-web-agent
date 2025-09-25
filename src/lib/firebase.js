// Firebase configuration and initialization
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';

// Firebase config from environment variables with safe fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyA8BZkFdGW-FgVIeUXMmyK4b2JML_RXEss',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'nexus-e0771.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'nexus-e0771',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'nexus-e0771.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '912987616508',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:912987616508:web:453dad2bc9038ce5af1379',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-FP8722PHK2'
};

// Debug (masked): verify config is loaded
console.debug('Firebase Config (masked):', {
  apiKey: firebaseConfig.apiKey ? `${firebaseConfig.apiKey.slice(0, 8)}...` : 'undefined',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId ? `${firebaseConfig.appId.slice(0, 8)}...` : 'undefined',
  measurementId: firebaseConfig.measurementId || '(none)'
});

// Initialize Firebase app (idempotent)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Initialize Firebase Auth
export const auth = getAuth(app);

// Google Auth Provider
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export default app;