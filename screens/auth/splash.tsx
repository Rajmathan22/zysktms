import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { cssInterop } from 'nativewind';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, View } from 'react-native';
import { useAuthContext } from '../../providers/AuthProvider';


const SplashScreen = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const tryBiometricUnlock = async () => {
    // 1. Check if device has biometrics/passcode
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const hasEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!hasHardware || !hasEnrolled) {
      // No biometrics or passcode set up.
      // We can't show a prompt, but the user *is* logged in (with Google).
      // So we return 'true' to let them proceed to the app.
      return true;
    }

    // 2. Show the prompt
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock to continue',
    });
    
    // 3. Return true or false
    return result.success;
  };

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(async () => {
        if (user) {
          const biometricsEnabled = await SecureStore.getItemAsync('biometricsEnabled');
          if (biometricsEnabled === 'true') {
            tryBiometricUnlock().then((success) => {
              if (success) {
                router.replace('/(tabs)/home');
              } else {
                router.replace('/(auth)/login');
              }
            });
          } else {
            router.replace('/(tabs)/home');
          }
        } else {
          router.replace('/(auth)/login');
        }
      }, 1000); 

      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Animated.View
        className="items-center justify-center"
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <Image
          source={require('../../assets/images/zysk-mobile-logo.png')}
          className="w-[200] h-[200]"
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

cssInterop(Animated.View, { className: 'style' });

export default SplashScreen;
