import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile,
  onAuthStateChanged,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail
} from 'firebase/auth';
import { auth } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  sendVerificationEmail: () => Promise<{ success: boolean; error?: string }>;
  updateUserProfile: (data: { displayName?: string; photoURL?: string }) => Promise<{ success: boolean; error?: string }>;
  updateUserEmail: (newEmail: string, password: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  reauthenticate: (password: string) => Promise<boolean>;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  refreshUserData: () => Promise<void>;
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
              // Create a minimal user object for faster load
              const minimalUser = {
                uid: parsedState.user.uid,
                email: parsedState.user.email,
                emailVerified: parsedState.user.emailVerified || false,
                displayName: parsedState.user.displayName || null,
                photoURL: parsedState.user.photoURL || null,
                phoneNumber: parsedState.user.phoneNumber || null,
                metadata: parsedState.user.metadata || { creationTime: '', lastSignInTime: '' },
                providerData: [],
                refreshToken: '',
                tenantId: null,
                delete: async () => {},
                getIdToken: async () => '',
                getIdTokenResult: async () => ({ token: '', expirationTime: '', issuedAtTime: '', authTime: '', signInProvider: null, signInSecondFactor: null, claims: {} }),
                reload: async () => {},
                toJSON: () => ({}),
                isAnonymous: false,
                providerId: 'firebase',
              } as User;
              
              setUser(minimalUser);
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
      if (firebaseUser) {
        try {
          // Force refresh to get latest data
          await firebaseUser.reload();
          const refreshedUser = auth.currentUser;
          setUser(refreshedUser);
          
          // Save to AsyncStorage
          if (refreshedUser) {
            const userData = {
              uid: refreshedUser.uid,
              email: refreshedUser.email,
              displayName: refreshedUser.displayName,
              photoURL: refreshedUser.photoURL,
              emailVerified: refreshedUser.emailVerified,
              phoneNumber: refreshedUser.phoneNumber,
              metadata: refreshedUser.metadata
            };
            
            await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
              user: userData,
              timestamp: Date.now(),
            }));
          }
        } catch (error) {
          console.error('Error refreshing user:', error);
          setUser(firebaseUser);
        }
      } else {
        setUser(null);
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, [initialized]);

  // Function to manually refresh user data
  const refreshUserData = async () => {
    if (user) {
      try {
        await user.reload();
        const refreshedUser = auth.currentUser;
        setUser(refreshedUser);
      } catch (error) {
        console.error('Failed to refresh user data:', error);
      }
    }
  };

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Force refresh to get latest verification status
      await userCredential.user.reload();
      
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

  const signup = async (name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update profile with display name
      await updateProfile(userCredential.user, {
        displayName: name,
      });

      // Send verification email
      await sendEmailVerification(userCredential.user);
      
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

  const logout = async (): Promise<void> => {
    try {
      setLoading(true);
      console.log('Attempting to sign out from Firebase...');
      
      // First sign out from Firebase
      await signOut(auth);
      console.log('✅ Firebase sign out successful');
      
      // Clear AsyncStorage
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      console.log('✅ AsyncStorage cleared');
      
      // Manually set user to null immediately
      setUser(null);
      console.log('✅ User state set to null');
      
      // Optional: Force a small delay to ensure state is cleared
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error: any) {
      console.error('❌ Logout error:', error);
      
      let errorMessage = 'Logout failed. Please try again.';
      
      switch (error.code) {
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'Logout failed.';
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
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

  const sendVerificationEmail = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'No user logged in' };
      }

      // Check if email is already verified
      if (auth.currentUser.emailVerified) {
        return { success: false, error: 'Email is already verified' };
      }

      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (error: any) {
      console.error('Send verification email error:', error);
      
      let errorMessage = 'Failed to send verification email.';
      
      switch (error.code) {
        case 'auth/too-many-requests':
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 'auth/network-request-failed':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = error.message || 'Failed to send verification email.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const updateUserProfile = async (data: { displayName?: string; photoURL?: string }): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!auth.currentUser) {
        return { success: false, error: 'No user logged in' };
      }
      
      await updateProfile(auth.currentUser, data);
      
      // Update local state
      const updatedUser = { ...auth.currentUser };
      if (data.displayName !== undefined) {
        Object.assign(updatedUser, { displayName: data.displayName });
      }
      if (data.photoURL !== undefined) {
        Object.assign(updatedUser, { photoURL: data.photoURL });
      }
      
      setUser(updatedUser as User);

      // Update AsyncStorage
      try {
        const userData = {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          displayName: data.displayName || auth.currentUser.displayName,
          photoURL: data.photoURL || auth.currentUser.photoURL,
          emailVerified: auth.currentUser.emailVerified,
          phoneNumber: auth.currentUser.phoneNumber,
          metadata: auth.currentUser.metadata
        };
        
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
          user: userData,
          timestamp: Date.now(),
        }));
      } catch (storageError) {
        console.error('Failed to update auth state:', storageError);
      }
      
      return { success: true };
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      let errorMessage = 'Failed to update profile.';
      
      switch (error.code) {
        case 'auth/requires-recent-login':
          errorMessage = 'Please re-authenticate to update your profile.';
          break;
        default:
          errorMessage = error.message || 'Failed to update profile.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const updateUserEmail = async (newEmail: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser || !currentUser.email) {
        return { success: false, error: 'No user logged in' };
      }

      // Re-authenticate first
      const credential = EmailAuthProvider.credential(currentUser.email, password);
      await reauthenticateWithCredential(currentUser, credential);

      // Update email
      await updateEmail(currentUser, newEmail);

      // Send verification to new email
      await sendEmailVerification(currentUser);
      
      // Update local state
      setUser({ ...currentUser } as User);
      
      return { success: true };
    } catch (error: any) {
      console.error('Update email error:', error);
      
      let errorMessage = 'Failed to update email.';
      
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'This email is already in use.';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please re-login to update your email.';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        default:
          errorMessage = error.message || 'Failed to update email.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
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
          errorMessage = 'New password is too weak. Use at least 6 characters.';
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

  const deleteAccount = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) {
        return { success: false, error: 'No user logged in' };
      }

      // Re-authenticate first
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      
      // Delete user
      await user.delete();
      
      // Clear local storage
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      
      return { success: true };
    } catch (error: any) {
      console.error('Delete account error:', error);
      
      let errorMessage = 'Failed to delete account.';
      
      switch (error.code) {
        case 'auth/wrong-password':
          errorMessage = 'Incorrect password.';
          break;
        case 'auth/requires-recent-login':
          errorMessage = 'Please re-login to delete your account.';
          break;
        default:
          errorMessage = error.message || 'Failed to delete account.';
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    sendVerificationEmail,
    updateUserProfile,
    updateUserEmail,
    changePassword,
    reauthenticate,
    deleteAccount,
    refreshUserData,
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