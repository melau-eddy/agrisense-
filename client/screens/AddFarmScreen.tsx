import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { useTheme } from '@/hooks/useTheme';
import { useFarms } from '@/contexts/FarmContext';
import { useAuth } from '@/contexts/AuthContext';
import { Spacing, BorderRadius } from '@/constants/theme';

// Crop types options
const CROP_TYPES = [
  'Maize',
  'Wheat',
  'Rice',
  'Soybeans',
  'Cotton',
  'Vegetables',
  'Fruits',
  'Coffee',
  'Tea',
  'Sugarcane',
  'Potatoes',
  'Cassava',
  'Other'
];

// Soil types options
const SOIL_TYPES = [
  'Loamy',
  'Sandy',
  'Clay',
  'Silt',
  'Peaty',
  'Chalky',
  'Rocky',
  'Other'
];

// Irrigation types options
const IRRIGATION_TYPES = [
  'Drip Irrigation',
  'Sprinkler Irrigation',
  'Surface Irrigation',
  'Center Pivot',
  'Manual Irrigation',
  'Rainfed',
  'Other'
];

interface FarmFormData {
  name: string;
  location: string;
  totalAcres: string;
  description: string;
  soilType: string;
  irrigationType: string;
  latitude: string;
  longitude: string;
}

export default function AddFarmScreen() {
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { addFarm } = useFarms();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState<FarmFormData>({
    name: '',
    location: '',
    totalAcres: '',
    description: '',
    soilType: '',
    irrigationType: '',
    latitude: '',
    longitude: '',
  });
  
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Farm name is required';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.totalAcres.trim()) {
      newErrors.totalAcres = 'Total acres is required';
    } else {
      const acres = parseFloat(formData.totalAcres);
      if (isNaN(acres) || acres <= 0) {
        newErrors.totalAcres = 'Please enter a valid number';
      }
    }

    if (selectedCrops.length === 0) {
      newErrors.crops = 'Please select at least one crop type';
    }

    if (formData.latitude && formData.longitude) {
      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        newErrors.latitude = 'Invalid latitude (-90 to 90)';
      }
      if (isNaN(lng) || lng < -180 || lng > 180) {
        newErrors.longitude = 'Invalid longitude (-180 to 180)';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCropToggle = (crop: string) => {
    setSelectedCrops(prev => {
      if (prev.includes(crop)) {
        return prev.filter(c => c !== crop);
      } else {
        return [...prev, crop];
      }
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    if (!user) {
      Alert.alert('Authentication Required', 'Please login to add a farm.');
      return;
    }

    try {
      setLoading(true);

      const farmData = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        totalAcres: parseFloat(formData.totalAcres),
        cropTypes: selectedCrops,
        soilType: formData.soilType || 'Other',
        irrigationType: formData.irrigationType || 'Other',
        description: formData.description.trim() || '',
        coordinates: formData.latitude && formData.longitude ? {
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
        } : null,
        status: 'active' as const,
      };

      const result = await addFarm(farmData);

      if (result.success) {
        Alert.alert(
          '✅ Farm Added Successfully',
          `Your farm "${formData.name}" has been added to your account.`,
          [
            {
              text: 'View My Farms',
              onPress: () => navigation.goBack(),
            },
            {
              text: 'Add Another',
              onPress: () => {
                // Reset form
                setFormData({
                  name: '',
                  location: '',
                  totalAcres: '',
                  description: '',
                  soilType: '',
                  irrigationType: '',
                  latitude: '',
                  longitude: '',
                });
                setSelectedCrops([]);
                setErrors({});
              },
            },
          ]
        );
      } else {
        Alert.alert('❌ Error', result.error || 'Failed to add farm. Please try again.');
      }
    } catch (error: any) {
      console.error('Error adding farm:', error);
      Alert.alert('❌ Error', 'Failed to add farm. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderChip = (crop: string) => {
    const isSelected = selectedCrops.includes(crop);
    return (
      <TouchableOpacity
        key={crop}
        style={[
          styles.chip,
          {
            backgroundColor: isSelected ? theme.primary : theme.backgroundSecondary,
            borderColor: isSelected ? theme.primary : theme.border,
          },
        ]}
        onPress={() => handleCropToggle(crop)}
      >
        <Feather
          name={isSelected ? 'check-circle' : 'circle'}
          size={16}
          color={isSelected ? '#FFFFFF' : theme.textSecondary}
        />
        <ThemedText
          style={[
            styles.chipText,
            { color: isSelected ? '#FFFFFF' : theme.text },
          ]}
        >
          {crop}
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ThemedView style={styles.container}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Feather name="arrow-left" size={24} color={theme.text} />
            </TouchableOpacity>
            <ThemedText type="h2">Add New Farm</ThemedText>
            <View style={{ width: 40 }} />
          </View>

          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Add your farm details to start monitoring and controlling irrigation
          </ThemedText>

          {!user ? (
            <View style={styles.notLoggedInContainer}>
              <Feather name="alert-circle" size={48} color={theme.warning} />
              <ThemedText type="h3" style={styles.notLoggedInTitle}>
                Authentication Required
              </ThemedText>
              <ThemedText style={[styles.notLoggedInText, { color: theme.textSecondary }]}>
                Please login to add a farm. Farms are tied to your account for secure access.
              </ThemedText>
              <AuthButton
                title="Go to Login"
                onPress={() => navigation.navigate('Login' as never)}
                variant="primary"
                style={styles.loginButton}
              />
            </View>
          ) : (
            <View style={styles.form}>
              <AuthInput
                label="Farm Name *"
                placeholder="Enter farm name"
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
                error={errors.name}
                leftIcon={<Feather name="map-pin" size={20} color={theme.textSecondary} />}
                autoCapitalize="words"
              />

              <AuthInput
                label="Location *"
                placeholder="City, State, Country"
                value={formData.location}
                onChangeText={(text) => setFormData({ ...formData, location: text })}
                error={errors.location}
                leftIcon={<Feather name="map" size={20} color={theme.textSecondary} />}
                autoCapitalize="words"
              />

              <AuthInput
                label="Total Acres *"
                placeholder="Enter total acres"
                value={formData.totalAcres}
                onChangeText={(text) => setFormData({ ...formData, totalAcres: text })}
                error={errors.totalAcres}
                keyboardType="decimal-pad"
                leftIcon={<Feather name="maximize" size={20} color={theme.textSecondary} />}
              />

              <View style={styles.section}>
                <ThemedText style={[styles.sectionLabel, { color: theme.text }]}>
                  Crop Types *
                </ThemedText>
                {errors.crops && (
                  <ThemedText style={[styles.errorText, { color: theme.critical }]}>
                    {errors.crops}
                  </ThemedText>
                )}
                <View style={styles.chipsContainer}>
                  {CROP_TYPES.map(renderChip)}
                </View>
              </View>

              <View style={styles.row}>
                <View style={[styles.halfInput, { marginRight: Spacing.sm }]}>
                  <AuthInput
                    label="Soil Type"
                    placeholder="Select soil type"
                    value={formData.soilType}
                    onChangeText={(text) => setFormData({ ...formData, soilType: text })}
                    leftIcon={<Feather name="layers" size={20} color={theme.textSecondary} />}
                  />
                </View>
                <View style={[styles.halfInput, { marginLeft: Spacing.sm }]}>
                  <AuthInput
                    label="Irrigation Type"
                    placeholder="Select irrigation"
                    value={formData.irrigationType}
                    onChangeText={(text) => setFormData({ ...formData, irrigationType: text })}
                    leftIcon={<Feather name="droplet" size={20} color={theme.textSecondary} />}
                  />
                </View>
              </View>

              <View style={styles.section}>
                <ThemedText style={[styles.sectionLabel, { color: theme.text }]}>
                  Coordinates (Optional)
                </ThemedText>
                <View style={styles.row}>
                  <View style={[styles.halfInput, { marginRight: Spacing.sm }]}>
                    <AuthInput
                      placeholder="Latitude"
                      value={formData.latitude}
                      onChangeText={(text) => setFormData({ ...formData, latitude: text })}
                      error={errors.latitude}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  <View style={[styles.halfInput, { marginLeft: Spacing.sm }]}>
                    <AuthInput
                      placeholder="Longitude"
                      value={formData.longitude}
                      onChangeText={(text) => setFormData({ ...formData, longitude: text })}
                      error={errors.longitude}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>
              </View>

              <AuthInput
                label="Description (Optional)"
                placeholder="Additional notes about your farm"
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={3}
                style={styles.textArea}
                leftIcon={<Feather name="edit" size={20} color={theme.textSecondary} />}
              />

              <View style={styles.buttonContainer}>
                <AuthButton
                  title="Cancel"
                  onPress={() => navigation.goBack()}
                  variant="outline"
                  style={styles.cancelButton}
                />
                <AuthButton
                  title="Add Farm"
                  onPress={handleSubmit}
                  loading={loading}
                  variant="primary"
                  style={styles.submitButton}
                  disabled={
                    !formData.name.trim() ||
                    !formData.location.trim() ||
                    !formData.totalAcres.trim() ||
                    selectedCrops.length === 0 ||
                    loading ||
                    !user
                  }
                />
              </View>

              <View style={styles.userInfoSection}>
                <View style={[styles.userInfoCard, { backgroundColor: theme.backgroundSecondary }]}>
                  <Feather name="user" size={16} color={theme.textSecondary} />
                  <ThemedText style={[styles.userInfoText, { color: theme.textSecondary }]}>
                    Farm will be added to your account: {user.email}
                  </ThemedText>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl * 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backButton: {
    padding: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: Spacing.xl,
  },
  notLoggedInContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    paddingTop: Spacing['2xl'],
  },
  notLoggedInTitle: {
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  notLoggedInText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  loginButton: {
    marginTop: Spacing.md,
  },
  form: {
    gap: Spacing.lg,
  },
  section: {
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 12,
    marginBottom: Spacing.sm,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    gap: Spacing.xs,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
  },
  halfInput: {
    flex: 1,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.xl,
  },
  cancelButton: {
    flex: 1,
  },
  submitButton: {
    flex: 1,
  },
  userInfoSection: {
    marginTop: Spacing.lg,
  },
  userInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  userInfoText: {
    fontSize: 12,
    flex: 1,
  },
});
