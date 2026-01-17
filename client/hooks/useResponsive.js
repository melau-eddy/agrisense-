import { useWindowDimensions, Platform } from 'react-native';

export const useResponsive = () => {
  const { width, height } = useWindowDimensions();
  
  return {
    // Screen size breakpoints
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    
    // Platform detection
    isWeb: Platform.OS === 'web',
    isIOS: Platform.OS === 'ios',
    isAndroid: Platform.OS === 'android',
    
    // Dimensions
    width,
    height,
    
    // Responsive values
    responsiveWidth: (value) => {
      if (Platform.OS === 'web' && width > 1024) {
        return Math.min(value * 1.5, width * 0.8);
      }
      return value;
    },
    
    responsivePadding: () => {
      if (Platform.OS === 'web') {
        return width > 1024 ? 24 : width > 768 ? 20 : 16;
      }
      return 16;
    }
  };
};