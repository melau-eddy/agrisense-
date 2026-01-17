import React from 'react';
import { View } from 'react-native';
import { useResponsive } from '@/hooks/useResponsive';

const ResponsiveContainer = ({ children, style, fullWidth = false }) => {
  const { isDesktop, isTablet, isWeb, width } = useResponsive();
  
  const containerStyle = {
    flex: 1,
    // Center content on web for larger screens
    ...(isWeb && {
      alignItems: 'stretch',
      width: '100%',
      maxWidth: isDesktop ? 1200 : isTablet ? 800 : '100%',
      alignSelf: 'center',
      paddingHorizontal: isDesktop ? 24 : isTablet ? 20 : 16,
    }),
    // Allow override with fullWidth prop
    ...(fullWidth && {
      maxWidth: '100%',
      paddingHorizontal: 0,
    })
  };
  
  return (
    <View style={[containerStyle, style]}>
      {children}
    </View>
  );
};

export default ResponsiveContainer;