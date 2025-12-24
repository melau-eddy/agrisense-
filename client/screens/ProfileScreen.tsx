import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  Pressable, 
  Alert, 
  ScrollView,
  Modal,
  TextInput 
} from 'react-native';
import { Feather } from '@expo/vector-icons';
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
  
  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Logout", 
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert("Logout Failed", "Please try again.");
            }
          }
        },
      ]
    );
  };

  const handleResendVerification = async () => {
    try {
      await sendVerificationEmail();
      Alert.alert(
        "Verification Email Sent",
        "Please check your email for the verification link.",
        [{ text: "OK" }]
      );
    } catch (error: any) {
      Alert.alert("Failed to Send", error.message);
    }
  };

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
      await changePassword(passwordForm.currentPassword, passwordForm.newPassword);
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
    } catch (error: any) {
      Alert.alert("Change Password Failed", error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <>
      <ThemedView style={styles.container}>
        <ScrollView showsVerticalScrollIndicator={false}>
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
              <Pressable 
                style={[styles.verificationBadge, { backgroundColor: theme.warning + '20' }]}
                onPress={handleResendVerification}
              >
                <Feather name="alert-circle" size={16} color={theme.warning} />
                <ThemedText style={[styles.verificationText, { color: theme.warning }]}>
                  Email not verified. Tap to resend verification.
                </ThemedText>
              </Pressable>
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
            <Pressable 
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => Alert.alert("Coming Soon", "Profile settings will be available soon.")}
            >
              <View style={styles.menuLeft}>
                <Feather name="user" size={20} color={theme.text} />
                <ThemedText style={styles.menuText}>Edit Profile</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable 
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => setChangePasswordModal(true)}
            >
              <View style={styles.menuLeft}>
                <Feather name="lock" size={20} color={theme.text} />
                <ThemedText style={styles.menuText}>Change Password</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable 
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => Alert.alert("Coming Soon", "Notification settings will be available soon.")}
            >
              <View style={styles.menuLeft}>
                <Feather name="bell" size={20} color={theme.text} />
                <ThemedText style={styles.menuText}>Notifications</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>

            <Pressable 
              style={[styles.menuItem, { borderBottomColor: theme.border }]}
              onPress={() => Alert.alert("Coming Soon", "Help & support will be available soon.")}
            >
              <View style={styles.menuLeft}>
                <Feather name="help-circle" size={20} color={theme.text} />
                <ThemedText style={styles.menuText}>Help & Support</ThemedText>
              </View>
              <Feather name="chevron-right" size={20} color={theme.textSecondary} />
            </Pressable>
          </View>

          <Pressable 
            style={[styles.logoutButton, { backgroundColor: theme.backgroundSecondary }]}
            onPress={handleLogout}
          >
            <Feather name="log-out" size={20} color={theme.critical} />
            <ThemedText style={[styles.logoutText, { color: theme.critical }]}>
              Logout
            </ThemedText>
          </Pressable>

          <ThemedText style={[styles.version, { color: theme.textSecondary }]}>
            AgriSense v1.0.0
          </ThemedText>
        </ScrollView>
      </ThemedView>

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
              <Pressable onPress={() => setChangePasswordModal(false)}>
                <Feather name="x" size={24} color={theme.text} />
              </Pressable>
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.lg,
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
});
