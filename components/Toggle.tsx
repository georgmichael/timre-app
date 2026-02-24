import React, { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

const TRACK_WIDTH = 50;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;
const THUMB_PADDING = 3;

export default function Toggle({ value, onValueChange, disabled = false }: ToggleProps) {
  const { theme } = useTheme();
  const translateX = useRef(new Animated.Value(value ? TRACK_WIDTH - THUMB_SIZE - THUMB_PADDING : THUMB_PADDING)).current;
  const trackOpacity = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: value ? TRACK_WIDTH - THUMB_SIZE - THUMB_PADDING : THUMB_PADDING,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }),
      Animated.timing(trackOpacity, {
        toValue: value ? 1 : 0,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  }, [value]);

  const trackBg = trackOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [theme.border, theme.accent],
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => !disabled && onValueChange(!value)}
      disabled={disabled}
      style={[styles.track, { opacity: disabled ? 0.4 : 1 }]}
    >
      <Animated.View style={[styles.trackBg, { backgroundColor: trackBg }]} />
      <Animated.View
        style={[
          styles.thumb,
          { transform: [{ translateX }] },
        ]}
      />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  trackBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    position: 'absolute',
  },
});
