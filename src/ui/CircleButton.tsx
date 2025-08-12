import React from 'react';
import { Pressable, Text, StyleSheet, ViewStyle } from 'react-native';

interface CircleButtonProps {
  label: string;
  active?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function CircleButton({ label, active, onPress, style }: CircleButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.circle, active && styles.active, style]}
    >
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 90,
    height: 90,
    borderRadius: 75,
    backgroundColor: '#222',
    borderWidth: 3,
    borderColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  active: {
    backgroundColor: '#FFD700',
    borderColor: '#FFD700',
  },
  text: {
    color: '#FFD700',
    fontWeight: '700',
    fontSize: 18,
    letterSpacing: 1,
  },
  textActive: {
    color: '#111',
    fontWeight: '900',
  },
});
