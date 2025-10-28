// src/components/common/Button.tsx
import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../../constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'disabled';
}

const Button = ({ title, onPress, loading = false, variant = 'primary' }: ButtonProps) => {
  const backgroundColor =
    variant === 'secondary' ? '#7E57C2' : variant === 'disabled' ? '#C7C7C7' : Colors.primary;
  const textColor = variant === 'disabled' ? '#6B6B6B' : Colors.white;
  return (
    <Pressable onPress={onPress} style={[styles.button, { backgroundColor }]} disabled={loading || variant === 'disabled'}>
      {loading ? (
        <ActivityIndicator color={Colors.white} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.primary,
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginVertical: 10,
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    fontFamily: 'Nunito-Bold',
  },
});

export default Button;