// /config/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";

// CORRECT Firebase configuration with Asia region
const firebaseConfig = {
  apiKey: "AIzaSyAETa9y1zBLsNi-DR7zwOrWBMiG-mDTOdU",
  authDomain: "agrisense-f4c16.firebaseapp.com",
  databaseURL: "https://agrisense-f4c16-default-rtdb.asia-southeast1.firebasedatabase.app", // CORRECT URL
  projectId: "agrisense-f4c16",
  storageBucket: "agrisense-f4c16.firebasestorage.app",
  messagingSenderId: "655954688754",
  appId: "1:655954688754:android:15f6bb92146da40a1b6e6b",
};

// Initialize Firebase
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("✅ Firebase app initialized successfully");
  console.log("Database URL:", firebaseConfig.databaseURL);
} catch (error) {
  console.error("❌ Failed to initialize Firebase:", error);
  throw error; // Re-throw to see the error
}

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const database = getDatabase(app);

// Export the app
export { app };
export default app;