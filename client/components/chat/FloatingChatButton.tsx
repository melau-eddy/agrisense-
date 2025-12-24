import React, { useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '@/hooks/useTheme';
import { useChat } from '@/contexts/ChatContext';
import { ThemedText } from '../ThemedText';
import { Spacing, BorderRadius, Shadows } from '@/constants/theme';

export default function FloatingChatButton() {
  const { theme } = useTheme();
  const { toggleChat, isChatVisible } = useChat();
  
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const handlePress = () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: rotateAnim._value + 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    toggleChat();
  };

  // Pulsing animation effect
  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();

    return () => {
      pulse.stop();
    };
  }, []);

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (isChatVisible) return null;

  return (
    <Animated.View 
      style={[
        styles.container,
        {
          transform: [{ scale: scaleAnim }],
          ...Shadows.large,
        }
      ]}
    >
      <Pressable
        onPress={handlePress}
        style={[
          styles.button,
          { 
            backgroundColor: theme.primary,
            borderColor: theme.primaryVariant,
          }
        ]}
      >
        <Animated.View style={[
          styles.iconContainer,
          { 
            transform: [
              { scale: pulseAnim },
              { rotate: rotateInterpolate }
            ] 
          }
        ]}>
          <Feather name="zap" size={28} color="#FFFFFF" />
        </Animated.View>
        
        {/* AI Badge */}
        <View style={[styles.badge, { backgroundColor: theme.accent }]}>
          <ThemedText style={styles.badgeText}>AI</ThemedText>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Spacing["3xl"],
    right: Spacing.lg,
    zIndex: 1000,
  },
  button: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    position: 'relative',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
