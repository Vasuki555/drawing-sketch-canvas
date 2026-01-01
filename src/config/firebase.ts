import { initializeApp, FirebaseApp, getApps, getApp } from "firebase/app";
import { getAuth, Auth, initializeAuth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import getReactNativePersistence dynamically to handle version differences
let getReactNativePersistence: any = null;
try {
  const authModule = require('firebase/auth');
  getReactNativePersistence = authModule.getReactNativePersistence;
} catch (error) {
  console.warn('getReactNativePersistence not available, using default auth');
}

// Your actual Firebase configuration from Firebase Console
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyBsSP4zDTwW-02xDAFj5A1EfXcQ82GVTnU",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "drawing-sketch-canvas.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "drawing-sketch-canvas",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "drawing-sketch-canvas.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "687762803688",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:687762803688:web:1933a3378f701a56ef725d",
  measurementId: "G-CXLY31D48J"
};

console.log('Firebase config loaded:', {
  apiKey: firebaseConfig.apiKey ? 'Set' : 'Missing',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  demoMode: process.env.EXPO_PUBLIC_DEMO_MODE
});

// Initialize Firebase (prevent duplicate initialization)
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  // Check if Firebase app is already initialized
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp(); // Use existing app
  }
  
  // Initialize Auth with AsyncStorage persistence for React Native if available
  try {
    if (getReactNativePersistence) {
      auth = initializeAuth(app, {
        persistence: getReactNativePersistence(AsyncStorage)
      });
      console.log('Firebase initialized successfully with AsyncStorage persistence');
    } else {
      auth = getAuth(app);
      console.log('Firebase initialized successfully with default persistence');
    }
  } catch (error: any) {
    // If auth is already initialized, get the existing instance
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
      console.log('Firebase auth already initialized, using existing instance');
    } else {
      throw error;
    }
  }
  
  db = getFirestore(app);
  
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error; // Let the error bubble up instead of silently failing
}

export { auth, db };
export default app;

