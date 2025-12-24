import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  Pressable,
  Alert,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useTheme } from '@/hooks/useTheme';
import { useChat } from '@/contexts/ChatContext';
import { Spacing, BorderRadius } from '@/constants/theme';

export default function SettingsScreen() {
  const { theme } = useTheme();
  const { config, updateConfig, validateApiKey, availableModels } = useChat();
  
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [showApiKey, setShowApiKey] = useState(false);
  const [validating, setValidating] = useState(false);

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) {
      Alert.alert('Error', 'Please enter an API key');
      return;
    }

    setValidating(true);
    try {
      const isValid = await validateApiKey(apiKey.trim());
      
      if (isValid) {
        await updateConfig({ apiKey: apiKey.trim() });
        Alert.alert('Success', 'API key saved and validated successfully');
      } else {
        Alert.alert('Invalid Key', 'The API key appears to be invalid. Please check and try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate API key. Please try again.');
    } finally {
      setValidating(false);
    }
  };

  const handleModelChange = (modelId: string) => {
    updateConfig({ model: modelId });
    Alert.alert('Model Changed', `AI model updated to ${availableModels.find(m => m.id === modelId)?.name}`);
  };

  const handleTemperatureChange = (value: string) => {
    const temp = parseFloat(value);
    if (!isNaN(temp) && temp >= 0 && temp <= 2) {
      updateConfig({ temperature: temp });
    }
  };

  const handleMaxTokensChange = (value: string) => {
    const tokens = parseInt(value);
    if (!isNaN(tokens) && tokens >= 1 && tokens <= 4096) {
      updateConfig({ maxTokens: tokens });
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            API Configuration
          </ThemedText>
          
          <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingTitle}>Groq API Key</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Required for AI chat features. Get your key from console.groq.com
                </ThemedText>
              </View>
            </View>

            <View style={styles.apiKeyContainer}>
              <TextInput
                style={[
                  styles.apiKeyInput,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.border,
                  }
                ]}
                value={showApiKey ? apiKey : '•'.repeat(apiKey.length || 10)}
                onChangeText={setApiKey}
                placeholder="sk-..."
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showApiKey}
                editable={!validating}
              />
              <Pressable
                onPress={() => setShowApiKey(!showApiKey)}
                style={styles.eyeButton}
              >
                <Feather
                  name={showApiKey ? 'eye-off' : 'eye'}
                  size={20}
                  color={theme.textSecondary}
                />
              </Pressable>
            </View>

            <Pressable
              style={[
                styles.saveButton,
                { 
                  backgroundColor: validating ? theme.backgroundTertiary : theme.primary,
                  opacity: validating ? 0.7 : 1,
                }
              ]}
              onPress={handleSaveApiKey}
              disabled={validating}
            >
              {validating ? (
                <ThemedText style={[styles.saveButtonText, { color: theme.buttonText }]}>
                  Validating...
                </ThemedText>
              ) : (
                <>
                  <Feather name="check-circle" size={18} color={theme.buttonText} />
                  <ThemedText style={[styles.saveButtonText, { color: theme.buttonText }]}>
                    Save & Validate
                  </ThemedText>
                </>
              )}
            </Pressable>

            {config.apiKey && (
              <View style={styles.statusContainer}>
                <Feather name="check-circle" size={16} color={theme.success} />
                <ThemedText style={[styles.statusText, { color: theme.success }]}>
                  API key is configured
                </ThemedText>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            AI Model Settings
          </ThemedText>
          
          <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingTitle}>Model Selection</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Choose which AI model to use for responses
                </ThemedText>
              </View>
            </View>

            <View style={styles.modelsContainer}>
              {availableModels.map((model) => (
                <Pressable
                  key={model.id}
                  style={[
                    styles.modelButton,
                    {
                      backgroundColor: config.model === model.id 
                        ? theme.primary + '20' 
                        : theme.backgroundDefault,
                      borderColor: config.model === model.id 
                        ? theme.primary 
                        : theme.border,
                    }
                  ]}
                  onPress={() => handleModelChange(model.id)}
                >
                  <View style={styles.modelInfo}>
                    <ThemedText style={styles.modelName}>{model.name}</ThemedText>
                    <ThemedText style={[styles.modelId, { color: theme.textSecondary }]}>
                      {model.id}
                    </ThemedText>
                  </View>
                  {config.model === model.id && (
                    <Feather name="check-circle" size={20} color={theme.primary} />
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            Response Settings
          </ThemedText>
          
          <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingTitle}>Temperature</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Controls randomness: 0 = deterministic, 2 = creative
                </ThemedText>
              </View>
              <TextInput
                style={[
                  styles.numberInput,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.border,
                  }
                ]}
                value={config.temperature.toString()}
                onChangeText={handleTemperatureChange}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>

            <View style={styles.sliderContainer}>
              <View style={[styles.sliderTrack, { backgroundColor: theme.border }]}>
                <View 
                  style={[
                    styles.sliderFill, 
                    { 
                      width: `${(config.temperature / 2) * 100}%`,
                      backgroundColor: theme.primary,
                    }
                  ]} 
                />
              </View>
              <View style={styles.sliderLabels}>
                <ThemedText style={[styles.sliderLabel, { color: theme.textSecondary }]}>
                  0.0
                </ThemedText>
                <ThemedText style={[styles.sliderLabel, { color: theme.textSecondary }]}>
                  1.0
                </ThemedText>
                <ThemedText style={[styles.sliderLabel, { color: theme.textSecondary }]}>
                  2.0
                </ThemedText>
              </View>
            </View>

            <View style={[styles.settingRow, styles.settingRowLast]}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingTitle}>Max Response Length</ThemedText>
                <ThemedText style={[styles.settingDescription, { color: theme.textSecondary }]}>
                  Maximum tokens in AI response (1-4096)
                </ThemedText>
              </View>
              <TextInput
                style={[
                  styles.numberInput,
                  {
                    backgroundColor: theme.backgroundDefault,
                    color: theme.text,
                    borderColor: theme.border,
                  }
                ]}
                value={config.maxTokens.toString()}
                onChangeText={handleMaxTokensChange}
                keyboardType="numeric"
                maxLength={4}
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText type="h3" style={styles.sectionTitle}>
            About
          </ThemedText>
          
          <View style={[styles.card, { backgroundColor: theme.backgroundSecondary }]}>
            <View style={styles.aboutItem}>
              <Feather name="cpu" size={18} color={theme.textSecondary} />
              <ThemedText style={[styles.aboutText, { color: theme.textSecondary }]}>
                Powered by Groq AI Infrastructure
              </ThemedText>
            </View>
            <View style={styles.aboutItem}>
              <Feather name="shield" size={18} color={theme.textSecondary} />
              <ThemedText style={[styles.aboutText, { color: theme.textSecondary }]}>
                Your API key is stored securely on device
              </ThemedText>
            </View>
            <View style={styles.aboutItem}>
              <Feather name="globe" size={18} color={theme.textSecondary} />
              <ThemedText style={[styles.aboutText, { color: theme.textSecondary }]}>
                Get API key: console.groq.com
              </ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing["4xl"],
  },
  section: {
    marginBottom: Spacing["2xl"],
  },
  sectionTitle: {
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  settingRowLast: {
    marginBottom: 0,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  settingDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  apiKeyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  apiKeyInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    fontSize: 14,
    fontFamily: 'monospace',
  },
  eyeButton: {
    padding: Spacing.md,
    marginLeft: Spacing.sm,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  statusText: {
    fontSize: 14,
  },
  modelsContainer: {
    gap: Spacing.md,
  },
  modelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  modelInfo: {
    flex: 1,
  },
  modelName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  modelId: {
    fontSize: 12,
    fontFamily: 'monospace',
  },
  numberInput: {
    width: 80,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 16,
    textAlign: 'center',
  },
  sliderContainer: {
    marginBottom: Spacing.lg,
  },
  sliderTrack: {
    height: 4,
    borderRadius: 2,
    marginBottom: Spacing.sm,
  },
  sliderFill: {
    height: '100%',
    borderRadius: 2,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
  },
  aboutItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  aboutText: {
    fontSize: 14,
  },
});
