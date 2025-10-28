// src/components/common/SocialButton.tsx
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Platform, ColorValue } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';

// We can add more providers here in the future
type SocialProvider = 'google' | 'github';

interface SocialButtonProps {
  provider: SocialProvider;
  onPress: () => void;
}

const providerConfig = {
  google: {
    text: 'Continue with Google',
    icon: 'G',
    backgroundColor: Colors.googleBlue,
    gradientColors: [Colors.googleBlue, '#3367D6'] as const,
  },
  github: {
    text: 'Continue with GitHub',
    icon: '</>',
    backgroundColor: Colors.githubBlack,
    gradientColors: [Colors.githubBlack, '#24292E'] as const,
  },
};

const SocialButton = ({ provider, onPress }: SocialButtonProps) => {
  const config = providerConfig[provider];

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.buttonContainer}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={config.gradientColors}
        style={styles.button}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.iconText}>{config.icon}</Text>
        </View>
        <Text style={styles.text}>{config.text}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    marginVertical: 4,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    overflow: 'hidden',
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: 'bold',
  },
  text: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
});

export default SocialButton;