import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth, clearAuthPersistence } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  reauthenticate: (password: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Storage keys
const AUTH_STORAGE_KEY = '@agrisense_auth_state';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load saved auth state on startup
  useEffect(() => {
    const loadAuthState = async () => {
      try {
        const savedAuthState = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
        if (savedAuthState) {
          const parsedState = JSON.parse(savedAuthState);
          if (parsedState.user && parsedState.timestamp) {
            // Check if saved state is less than 1 hour old
            const oneHourAgo = Date.now() - (60 * 60 * 1000);
            if (parsedState.timestamp > oneHourAgo) {
              setUser(parsedState.user);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load auth state:', error);
      } finally {
        setInitialized(true);
      }
    };

    loadAuthState();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    if (!initialized) return;

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);

      // Save auth state
      try {
        if (firebaseUser) {
          const userData = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName,
            photoURL: firebaseUser.photoURL,
          };
          
          await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
            user: userData,
            timestamp: Date.now(),
          }));
        } else {
          await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
        }
      } catch (error) {
        console.error('Failed to save auth state:', error);
      }
    });

    return unsubscribe;
  }, [initialized]);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-disabled':
          errorMessage = 'This account has been disabled.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/too-many-requests':
          errorMessage = 'Too many attempts. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'Login failed.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: name,
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Signup error:', error);
      
      let errorMessage = 'Signup failed. Please try again.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already registered.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled.';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak. Use at least 6 characters.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'Signup failed.';
      }
      
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      await clearAuthPersistence();
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (error: any) {
      console.error('Logout error:', error);
      throw new Error('Logout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error: any) {
      console.error('Reset password error:', error);
      
      let errorMessage = 'Failed to send reset email.';
      
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/user-not-found':
          errorMessage = 'No account found with this email.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'Failed to send reset email.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }) => {
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'No user logged in' };
      }
      
      await updateProfile(auth.currentUser, data);
      return { success: true };
    } catch (error: any) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Failed to update profile.' };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return { success: false, error: 'No user logged in' };
      }

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Change password
      await updatePassword(user, newPassword);
      
      return { success: true };
    } catch (error: any) {
      console.error('Change password error:', error);
      
      let errorMessage = 'Failed to change password.';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Current password is incorrect.';
          break;
        case 'auth/weak-password':
          errorMessage = 'New password is too weak.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please log in again to change your password.';
          break;
        default:
          errorMessage = error.message || 'Failed to change password.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const reauthenticate = async (password: string): Promise<boolean> => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) return false;

      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch (error) {
      console.error('Re-authentication error:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    updateUserProfile,
    changePassword,
    reauthenticate,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}