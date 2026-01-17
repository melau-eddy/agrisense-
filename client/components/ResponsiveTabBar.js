import React from 'react';
import { Platform, View } from 'react-native';
import { BottomTabBar } from '@react-navigation/bottom-tabs';
import { useResponsive } from '@/hooks/useResponsive';

const ResponsiveTabBar = (props) => {
  const { isDesktop, isWeb } = useResponsive();
  
  if (isWeb && isDesktop) {
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
            <button
              key={route.key}
              onClick={onPress}
              style={{
                flex: 1,
                maxWidth: 200,
                alignItems: 'center',
                paddingVertical: 16,
                backgroundColor: 'transparent',
                border: 'none',
                borderBottomWidth: 2,
                borderBottomStyle: 'solid',
                borderBottomColor: isFocused ? (options.tabBarActiveTintColor || '#2D7A4F') : 'transparent',
                cursor: 'pointer',
              }}
            >
              <View style={{ alignItems: 'center' }}>
                {options.tabBarIcon && options.tabBarIcon({
                  focused: isFocused,
                  color: isFocused ? (options.tabBarActiveTintColor || '#2D7A4F') : (options.tabBarInactiveTintColor || '#6B7280'),
                  size: 24
                })}
                <span style={{
                  marginTop: 4,
                  fontSize: 12,
                  fontWeight: isFocused ? '600' : '500',
                  color: isFocused ? (options.tabBarActiveTintColor || '#2D7A4F') : (options.tabBarInactiveTintColor || '#6B7280'),
                }}>
                  {options.tabBarLabel || route.name}
                </span>
              </View>
            </button>
          );
        })}
      </View>
    );
  }
  
  // Mobile/Tablet - use default bottom tab bar
  return <BottomTabBar {...props} />;
};

export default ResponsiveTabBar;