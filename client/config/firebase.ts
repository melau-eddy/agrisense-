import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// AgriSense Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyD6NPnDw7xruqaVnAKvxYxmX3HIgWCPjTk",
  authDomain: "agrisense-11849.firebasestorage.app",
  projectId: "agrisense-11849",
  storageBucket: "agrisense-11849.firebasestorage.app",
  messagingSenderId: "137280528526",
  appId: "1:137280528526:android:50dd6ac7647a51a5f2e9df",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services (works for both web and native)
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { app, auth, db, storage };