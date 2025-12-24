import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// AgriSense Firebase Configuration - USING YOUR ACTUAL CREDENTIALS
const firebaseConfig = {
  apiKey: "AIzaSyD6NPnDw7xruqaVnAKvxYxmX3HIgWCPjTk",
  authDomain: "agrisense-11849.firebaseapp.com",
  projectId: "agrisense-11849",
  storageBucket: "agrisense-11849.firebasestorage.app", // Updated to your storage bucket
  messagingSenderId: "137280528526",
  appId: "1:137280528526:android:50dd6ac7647a51a5f2e9df",
  measurementId: "" // Optional, add if you have it
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

// Initialize Firestore
const db = getFirestore(app);

// Initialize Storage
const storage = getStorage(app);

export { app, auth, db, storage };
