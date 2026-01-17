import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6NPnDw7xruqaVnAKvxYxmX3HIgWCPjTk",
  authDomain: "agrisense-11849.firebaseapp.com",
  projectId: "agrisense-11849",
  storageBucket: "agrisense-11849.firebasestorage.app",
  messagingSenderId: "137280528526",
  appId: "1:137280528526:android:50dd6ac7647a51a5f2e9df",
};

// Initialize Firebase
console.log('🚀 Initializing Firebase...');

const app = initializeApp(firebaseConfig);
console.log('✅ Firebase App initialized');

// Platform-specific auth initialization
let auth;

try {
  // Check if we're in a React Native/Expo environment
  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
    // For React Native/Expo
    console.log('📱 Detected React Native environment');
    
    // Dynamically import AsyncStorage only in native environment
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    
    // For React Native, we need a different approach
    // Option 1: Initialize auth without persistence for now
    auth = initializeAuth(app);
    console.log('✅ Firebase Auth initialized (React Native)');
    
    // Option 2: Try with async import
    // const { getReactNativePersistence } = require('firebase/auth');
    // auth = initializeAuth(app, {
    //   persistence: getReactNativePersistence(AsyncStorage)
    // });
    
  } else {
    // For Web environment
    console.log('🌐 Detected Web environment');
    auth = initializeAuth(app, {
      persistence: browserLocalPersistence
    });
    console.log('✅ Firebase Auth initialized (Web)');
  }
} catch (error) {
  console.warn('⚠️ Could not initialize auth with persistence, using default:', error);
  auth = initializeAuth(app);
  console.log('✅ Firebase Auth initialized (fallback)');
}

// Initialize Firestore
const db = getFirestore(app);
console.log('✅ Firebase Firestore initialized');

// Initialize Storage
const storage = getStorage(app);
console.log('✅ Firebase Storage initialized');

console.log('🎉 All Firebase services ready!');

export { app, auth, db, storage };

// Simple Firebase connection test
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    // Just check if auth is initialized
    return !!auth;
  } catch (error) {
    console.log('⚠️ Firebase connection test failed:', error);
    return false;
  }
} 