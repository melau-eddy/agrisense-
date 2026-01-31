import React from 'react';
import { Platform, View, TouchableOpacity, Text } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { useResponsive } from '@/hooks/useResponsive';

const ResponsiveTabBar = (props) => {
  const { isDesktop, isWeb } = useResponsive();
  
  console.log('ResponsiveTabBar debug:', { isWeb, isDesktop, Platform: Platform.OS });
  
  // For mobile native platforms (iOS/Android), always use default tab bar
  if (Platform.OS !== 'web') {
    return <BottomTabBar {...props} />;
  }
  
  // For web platform
  if (isWeb) {
    if (isDesktop) {
      // Desktop web layout - horizontal tab bar at top
      return (
        <View style={{
          backgroundColor: props.descriptors[props.state.routes[props.state.index].key].options.tabBarStyle?.backgroundColor || '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
          flexDirection: 'row',
          justifyContent: 'center',
          paddingHorizontal: 24,
        }}>
          {props.state.routes.map((route, index) => {
            const { options } = props.descriptors[route.key];
            const isFocused = props.state.index === index;
            
            const onPress = () => {
              const event = props.navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });
              
              if (!isFocused && !event.defaultPrevented) {
                props.navigation.navigate(route.name);
              }
            };
            
            return (
              <TouchableOpacity
                key={route.key}
                onPress={onPress}
                style={{
                  flex: 1,
                  maxWidth: 200,
                  alignItems: 'center',
                  paddingVertical: 16,
                  backgroundColor: 'transparent',
                  borderBottomWidth: 2,
                  borderBottomColor: isFocused ? (options.tabBarActiveTintColor || '#2D7A4F') : 'transparent',
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  {options.tabBarIcon && options.tabBarIcon({
                    focused: isFocused,
                    color: isFocused ? (options.tabBarActiveTintColor || '#2D7A4F') : (options.tabBarInactiveTintColor || '#6B7280'),
                    size: 24
                  })}
                  <Text style={{
                    marginTop: 4,
                    fontSize: 12,
                    fontWeight: isFocused ? '600' : '500',
                    color: isFocused ? (options.tabBarActiveTintColor || '#2D7A4F') : (options.tabBarInactiveTintColor || '#6B7280'),
                  }}>
                    {options.tabBarLabel || route.name}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      );
    } else {
      // Mobile web - use default bottom tab bar
      return <BottomTabBar {...props} />;
    }
  }
  
  // Default fallback for native platforms
  return <BottomTabBar {...props} />;
};

export default ResponsiveTabBar;