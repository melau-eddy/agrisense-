import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  StyleSheet, 
  Alert, 
  ScrollView,
  Modal,
  Switch,
  Linking,
  Platform,
  TouchableOpacity
} from 'react-native';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/contexts/AuthContext';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function ProfileScreen() {
  const { theme, isDark } = useTheme();
  const { user, logout, sendVerificationEmail, changePassword, updateUserProfile } = useAuth();
  
  // State for modals
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [notificationsModal, setNotificationsModal] = useState(false);
  const [helpSupportModal, setHelpSupportModal] = useState(false);
  
  // State for edit profile
  const [profileForm, setProfileForm] = useState({
    displayName: user?.displayName || '',
    phoneNumber: '', // You can add phone number to your user profile if needed
  });
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [profileLoading, setProfileLoading] = useState(false);
  
  // State for notifications
  const [notificationSettings, setNotificationSettings] = useState({
    pushNotifications: true,
    emailNotifications: true,
    marketingEmails: false,
    securityAlerts: true,
    cropUpdates: true,
    marketPrices: true,
    weatherAlerts: true,
  });
  
  // State for password change
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  
  // Use a ref to track if logout is in progress
  const logoutInProgress = useRef(false);

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || '',
        phoneNumber: '', // You can add this to your user object
      });
    }
  }, [user]);

  const handleLogout = () => {
    console.log('Logout button clicked');
    
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { 
          text: "Cancel", 
          style: "cancel"
        },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: () => {
            console.log('User confirmed logout');
            executeLogout();
          }
        },
      ]
    );
  };

  // Separate the actual logout logic
  const executeLogout = async () => {
    if (logoutInProgress.current) {
      return;
    }

    logoutInProgress.current = true;
    setIsLoggingOut(true);
    
    try {
      await logout();
    } catch (error: any) {
      console.error('Logout error:', error);
      Alert.alert("Logout Failed", error.message || "Please try again.");
    } finally {
      setIsLoggingOut(false);
      logoutInProgress.current = false;
    }
  };

  // Test logout function (keep this for debugging)
  const handleTestLogout = async () => {
    console.log('Test logout clicked');
    try {
      await logout();
      console.log('Test logout successful');
    } catch (error: any) {
      console.error('Test logout failed:', error);
      Alert.alert("Test Logout Failed", error.message || "Please try again.");
    }
  };

  const handleResendVerification = async () => {
    try {
      const result = await sendVerificationEmail();
      if (result.success) {
        Alert.alert(
          "Verification Email Sent",
          "Please check your email for the verification link.",
          [{ text: "OK" }]
        );
      } else {
        Alert.alert("Failed to Send", result.error || "Unknown error");
      }
    } catch (error: any) {
      Alert.alert("Failed to Send", error.message || "Unknown error");
    }
  };

  // Edit Profile Functions
  const validateProfileForm = () => {
    const errors: Record<string, string> = {};

    if (!profileForm.displayName.trim()) {
      errors.displayName = "Display name is required";
    } else if (profileForm.displayName.length < 2) {
      errors.displayName = "Display name must be at least 2 characters";
    }

    // Optional phone number validation
    if (profileForm.phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(profileForm.phoneNumber.replace(/\D/g, ''))) {
      errors.phoneNumber = "Please enter a valid phone number";
    }

    setProfileErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdateProfile = async () => {
    if (!validateProfileForm()) return;

    setProfileLoading(true);
    try {
      const result = await updateUserProfile({
        displayName: profileForm.displayName.trim(),
      });
      
      if (result.success) {
        Alert.alert(
          "Profile Updated",
          "Your profile has been updated successfully.",
          [
            { 
              text: "OK", 
              onPress: () => {
                setEditProfileModal(false);
              }
            }
          ]
        );
      } else {
        Alert.alert("Update Failed", result.error || "Unknown error");
      }
    } catch (error: any) {
      Alert.alert("Update Failed", error.message || "Unknown error");
    } finally {
      setProfileLoading(false);
    }
  };

  // Password Change Functions
  const validatePasswordForm = () => {
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = "Current password is required";
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = "New password is required";
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setPasswordLoading(true);
    try {
      const result = await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      if (result.success) {
        Alert.alert(
          "Success",
          "Your password has been changed successfully.",
          [
            { 
              text: "OK", 
              onPress: () => {
                setChangePasswordModal(false);
                setPasswordForm({
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                });
              }
            }
          ]
        );
      } else {
        Alert.alert("Change Password Failed", result.error || "Unknown error");
      }
    } catch (error: any) {
      Alert.alert("Change Password Failed", error.message || "Unknown error");
    } finally {
      setPasswordLoading(false);
    }
  };

  // Notification Functions
  const handleNotificationToggle = async (key: keyof typeof notificationSettings) => {
    const newSettings = {
      ...notificationSettings,
      [key]: !notificationSettings[key]
    };
    
    setNotificationSettings(newSettings);
    
    try {
      console.log('Notification settings updated:', newSettings);
    } catch (error) {
      setNotificationSettings(notificationSettings);
      Alert.alert("Error", "Failed to update notification settings");
    }
  };

  // Help & Support Functions
  const handleContactSupport = () => {
    const email = 'support@agrisense.com';
    const subject = 'AgriSense Support Request';
    const body = `Hello AgriSense Support,\n\nI need assistance with:\n\n[Please describe your issue here]\n\nUser ID: ${user?.uid}\nApp Version: 1.0.0\nPlatform: ${Platform.OS}`;
    
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
      .catch(() => {
        Alert.alert("Error", "Could not open email app. Please email support@agrisense.com");
      });
  };

  const handleViewFAQ = () => {
    Linking.openURL('https://agrisense.faq.com')
      .catch(() => {
        Alert.alert("Error", "Could not open FAQ page");
      });
  };

  const handleSubmitFeedback = () => {
    const email = 'feedback@agrisense.com';
    const subject = 'AgriSense App Feedback';
    const body = `AgriSense Feedback:\n\n[Please share your feedback here]\n\nUser ID: ${user?.uid}\nApp Version: 1.0.0`;
    
    Linking.openURL(`mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
      .catch(() => {
        Alert.alert("Error", "Could not open email app. Please email feedback@agrisense.com");
      });
  };

  const handleRateApp = () => {
    if (Platform.OS === 'ios') {
      Linking.openURL('https://apps.apple.com/app/idYOUR_APP_ID')
        .catch(() => {
          Alert.alert("Error", "Could not open App Store");
        });
    } else {
      Linking.openURL('https://play.google.com/store/apps/details?id=com.agrisense.app')
        .catch(() => {
          Alert.alert("Error", "Could not open Play Store");
        });
    }
  };

  return (
    <>
      <ThemedView style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
              <ThemedText style={styles.avatarText}>
                {user?.displayName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || 'U'}
              </ThemedText>
            </View>
            <ThemedText type="h2" style={styles.name}>
              {user?.displayName || 'User'}
            </ThemedText>
            <ThemedText style={[styles.email, { color: theme.textSecondary }]}>
              {user?.email}
            </ThemedText>
            
            {user && !user.emailVerified && (
              <TouchableOpacity 
                style={[styles.verificationBadge, { backgroundColor: theme.warning + '20' }]}
                onPress={handleResendVerification}
                activeOpacity={0.7}
              >
                <Feather name="alert-circle" size={16} color={theme.warning} />
                <ThemedText style={[styles.verificationText, { color: theme.warning }]}>
                  Email not verified. Tap to resend verification.
                </ThemedText>
              </TouchableOpacity>
            )}
            
            {user?.emailVerified && (
              <View style={[styles.verificationBadge, { backgroundColor: theme.success + '20' }]}>
                <Feather name="check-circle" size={16} color={theme.success} />
                <ThemedText style={[styles.verificationText, { color: theme.success }]}>
                  Email verified
                </ThemedText>
              </View>
            )}
          </View>

          <View style={styles.menu}>
            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => setEditProfileModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Feather name="user" size={20} color={theme.text} />
                <ThemedText style={styles.menuText}>Edit Profile</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => setChangePasswordModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Feather name="lock" size={20} color={theme.text} />
                <ThemedText style={styles.menuText}>Change Password</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => setNotificationsModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Feather name="bell" size={20} color={theme.text} />
                <ThemedText style={styles.menuText}>Notifications</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => setHelpSupportModal(true)}
              activeOpacity={0.7}
            >
              <View style={styles.menuLeft}>
                <Feather name="help-circle" size={20} color={theme.text} />
                <ThemedText style={styles.menuText}>Help & Support</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Test Logout Button - Styled like the real logout button */}
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: theme.backgroundSecondary, marginBottom: Spacing.md }]}
            onPress={handleTestLogout}
            activeOpacity={0.7}
          >
            <Feather name="log-out" size={20} color={theme.critical} />
            <ThemedText style={[styles.logoutText, { color: theme.critical }]}>
              Logout
            </ThemedText>
          </TouchableOpacity>

          

          <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
            AgriSense v1.0.0
          </ThemedText>
        </ScrollView>
      </ThemedView>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Edit Profile</ThemedText>
              <TouchableOpacity onPress={() => setEditProfileModal(false)} activeOpacity={0.7}>
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm} showsVerticalScrollIndicator={false}>
              <AuthInput
                label="Display Name"
                placeholder="Enter your name"
                value={profileForm.displayName}
                onChangeText={(text) => setProfileForm({...profileForm, displayName: text})}
                error={profileErrors.displayName}
                autoCapitalize="words"
                leftIcon={<Feather name="user" size={20} color={theme.textSecondary} />}
              />

              <AuthInput
                label="Email"
                placeholder="Your email address"
                value={user?.email || ''}
                editable={false}
                leftIcon={<Feather name="mail" size={20} color={theme.textSecondary} />}
              />

              <AuthInput
                label="Phone Number (Optional)"
                placeholder="+1 (555) 123-4567"
                value={profileForm.phoneNumber}
                onChangeText={(text) => setProfileForm({...profileForm, phoneNumber: text})}
                error={profileErrors.phoneNumber}
                keyboardType="phone-pad"
                leftIcon={<Feather name="phone" size={20} color={theme.textSecondary} />}
              />

              <View style={styles.modalButtons}>
                <AuthButton
                  title="Cancel"
                  onPress={() => setEditProfileModal(false)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <AuthButton
                  title="Save Changes"
                  onPress={handleUpdateProfile}
                  loading={profileLoading}
                  variant="primary"
                  style={{ flex: 1 }}
                  disabled={!profileForm.displayName.trim() || profileForm.displayName === user?.displayName}
                />
              </View>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Change Password</ThemedText>
              <TouchableOpacity onPress={() => setChangePasswordModal(false)} activeOpacity={0.7}>
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalForm}>
              <AuthInput
                label="Current Password"
                placeholder="Enter current password"
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm({...passwordForm, currentPassword: text})}
                error={passwordErrors.currentPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                leftIcon={<Feather name="lock" size={20} color={theme.textSecondary} />}
              />

              <AuthInput
                label="New Password"
                placeholder="Enter new password"
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm({...passwordForm, newPassword: text})}
                error={passwordErrors.newPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                leftIcon={<Feather name="key" size={20} color={theme.textSecondary} />}
              />

              <AuthInput
                label="Confirm New Password"
                placeholder="Confirm new password"
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm({...passwordForm, confirmPassword: text})}
                error={passwordErrors.confirmPassword}
                secureTextEntry={true}
                autoCapitalize="none"
                leftIcon={<Feather name="check-circle" size={20} color={theme.textSecondary} />}
              />

              <View style={styles.modalButtons}>
                <AuthButton
                  title="Cancel"
                  onPress={() => setChangePasswordModal(false)}
                  variant="outline"
                  style={{ flex: 1 }}
                />
                <AuthButton
                  title="Change Password"
                  onPress={handleChangePassword}
                  loading={passwordLoading}
                  variant="primary"
                  style={{ flex: 1 }}
                  disabled={!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                />
              </View>
            </View>
          </ThemedView>
        </View>
      </Modal>

      {/* Notifications Modal */}
      <Modal
        visible={notificationsModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Notification Settings</ThemedText>
              <TouchableOpacity onPress={() => setNotificationsModal(false)} activeOpacity={0.7}>
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.notificationsList} showsVerticalScrollIndicator={false}>
              <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                Push Notifications
              </ThemedText>
              
              <View style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <Feather name="bell" size={20} color={theme.text} />
                  <View>
                    <ThemedText style={styles.notificationTitle}>Push Notifications</ThemedText>
                    <ThemedText style={[styles.notificationDesc, { color: theme.textSecondary }]}>
                      Receive push notifications on this device
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.pushNotifications}
                  onValueChange={() => handleNotificationToggle('pushNotifications')}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor={notificationSettings.pushNotifications ? '#FFFFFF' : '#FFFFFF'}
                />
              </View>

              <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
                Email Notifications
              </ThemedText>
              
              <View style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <Feather name="mail" size={20} color={theme.text} />
                  <View>
                    <ThemedText style={styles.notificationTitle}>Email Notifications</ThemedText>
                    <ThemedText style={[styles.notificationDesc, { color: theme.textSecondary }]}>
                      Receive email notifications
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.emailNotifications}
                  onValueChange={() => handleNotificationToggle('emailNotifications')}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>

              <View style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <Feather name="alert-triangle" size={20} color={theme.text} />
                  <View>
                    <ThemedText style={styles.notificationTitle}>Security Alerts</ThemedText>
                    <ThemedText style={[styles.notificationDesc, { color: theme.textSecondary }]}>
                      Important security and account updates
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.securityAlerts}
                  onValueChange={() => handleNotificationToggle('securityAlerts')}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>

              <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: Spacing.lg }]}>
                Agricultural Updates
              </ThemedText>
              
              <View style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <MaterialIcons name="agriculture" size={20} color={theme.text} />
                  <View>
                    <ThemedText style={styles.notificationTitle}>Crop Updates</ThemedText>
                    <ThemedText style={[styles.notificationDesc, { color: theme.textSecondary }]}>
                      Updates about your crops and farming activities
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.cropUpdates}
                  onValueChange={() => handleNotificationToggle('cropUpdates')}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>

              <View style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <Feather name="trending-up" size={20} color={theme.text} />
                  <View>
                    <ThemedText style={styles.notificationTitle}>Market Prices</ThemedText>
                    <ThemedText style={[styles.notificationDesc, { color: theme.textSecondary }]}>
                      Daily market price updates
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.marketPrices}
                  onValueChange={() => handleNotificationToggle('marketPrices')}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>

              <View style={styles.notificationItem}>
                <View style={styles.notificationLeft}>
                  <Feather name="cloud" size={20} color={theme.text} />
                  <View>
                    <ThemedText style={styles.notificationTitle}>Weather Alerts</ThemedText>
                    <ThemedText style={[styles.notificationDesc, { color: theme.textSecondary }]}>
                      Weather updates and alerts for your farm
                    </ThemedText>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.weatherAlerts}
                  onValueChange={() => handleNotificationToggle('weatherAlerts')}
                  trackColor={{ false: theme.border, true: theme.primary }}
                />
              </View>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>

      {/* Help & Support Modal */}
      <Modal
        visible={helpSupportModal}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <ThemedView style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText type="h3">Help & Support</ThemedText>
              <TouchableOpacity onPress={() => setHelpSupportModal(false)} activeOpacity={0.7}>
                <Feather name="x" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.helpSupportList} showsVerticalScrollIndicator={false}>
              <TouchableOpacity 
                style={[styles.helpItem, { borderBottomColor: theme.border }]}
                onPress={handleContactSupport}
                activeOpacity={0.7}
              >
                <View style={styles.helpLeft}>
                  <Feather name="mail" size={24} color={theme.primary} />
                  <View>
                    <ThemedText style={styles.helpTitle}>Contact Support</ThemedText>
                    <ThemedText style={[styles.helpDesc, { color: theme.textSecondary }]}>
                      Get help from our support team
                    </ThemedText>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.helpItem, { borderBottomColor: theme.border }]}
                onPress={handleViewFAQ}
                activeOpacity={0.7}
              >
                <View style={styles.helpLeft}>
                  <Feather name="help-circle" size={24} color={theme.primary} />
                  <View>
                    <ThemedText style={styles.helpTitle}>FAQ & Documentation</ThemedText>
                    <ThemedText style={[styles.helpDesc, { color: theme.textSecondary }]}>
                      Find answers to common questions
                    </ThemedText>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.helpItem, { borderBottomColor: theme.border }]}
                onPress={handleSubmitFeedback}
                activeOpacity={0.7}
              >
                <View style={styles.helpLeft}>
                  <Feather name="message-square" size={24} color={theme.primary} />
                  <View>
                    <ThemedText style={styles.helpTitle}>Submit Feedback</ThemedText>
                    <ThemedText style={[styles.helpDesc, { color: theme.textSecondary }]}>
                      Share your suggestions with us
                    </ThemedText>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.helpItem, { borderBottomColor: theme.border }]}
                onPress={handleRateApp}
                activeOpacity={0.7}
              >
                <View style={styles.helpLeft}>
                  <Feather name="star" size={24} color={theme.primary} />
                  <View>
                    <ThemedText style={styles.helpTitle}>Rate Our App</ThemedText>
                    <ThemedText style={[styles.helpDesc, { color: theme.textSecondary }]}>
                      Rate AgriSense on the app store
                    </ThemedText>
                  </View>
                </View>
                <Feather name="chevron-right" size={20} color={theme.textSecondary} />
              </TouchableOpacity>

              <View style={styles.contactInfo}>
                <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
                  Contact Information
                </ThemedText>
                <ThemedText style={[styles.contactText, { color: theme.textSecondary }]}>
                  <ThemedText style={{ fontWeight: '600' }}>Email:</ThemedText> support@agrisense.com
                </ThemedText>
                <ThemedText style={[styles.contactText, { color: theme.textSecondary }]}>
                  <ThemedText style={{ fontWeight: '600' }}>Hours:</ThemedText> Mon-Fri, 9AM-6PM
                </ThemedText>
                <ThemedText style={[styles.contactText, { color: theme.textSecondary }]}>
                  <ThemedText style={{ fontWeight: '600' }}>Response Time:</ThemedText> Within 24 hours
                </ThemedText>
              </View>
            </ScrollView>
          </ThemedView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing["2xl"],
    paddingTop: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  name: {
    marginBottom: Spacing.xs,
  },
  email: {
    fontSize: 14,
    marginBottom: Spacing.sm,
  },
  verificationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
  },
  verificationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  menu: {
    marginBottom: Spacing.xl,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  menuText: {
    fontSize: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xl,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    marginBottom: Spacing.xl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    padding: Spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalForm: {
    gap: Spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  // Notifications styles
  notificationsList: {
    maxHeight: 400,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    letterSpacing: 0.5,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  notificationDesc: {
    fontSize: 12,
  },
  // Help & Support styles
  helpSupportList: {
    maxHeight: 400,
  },
  helpItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
  },
  helpLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  helpTitle: {
    fontSize: 16,
    marginBottom: 2,
  },
  helpDesc: {
    fontSize: 12,
  },
  contactInfo: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.md,
  },
  contactText: {
    fontSize: 14,
    marginBottom: Spacing.xs,
  },
});