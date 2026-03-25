import React from 'react';
import { StyleSheet, View, useWindowDimensions, ViewProps } from 'react-native';

interface ResponsiveViewProps extends ViewProps {
  maxWidth?: number;
  fullWidth?: boolean;
}

export const ResponsiveView: React.FC<ResponsiveViewProps> = ({ 
  children, 
  style, 
  maxWidth = 600, 
  fullWidth = false,
  ...props 
}) => {
  const { width } = useWindowDimensions();
  
  // If screen width is less than maxWidth, or if fullWidth is true, just use full width
  if (width <= maxWidth || fullWidth) {
    return (
      <View style={[{ flex: 1, width: '100%' }, style]} {...props}>
        {children}
      </View>
    );
  }

  // Otherwise, center the content with maxWidth
  return (
    <View style={styles.outerContainer}>
      <View 
        style={[
          styles.innerContainer, 
          { maxWidth: maxWidth },
          style
        ]} 
        {...props}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    width: '100%',
  },
  innerContainer: {
    flex: 1,
    width: '100%',
  },
});
