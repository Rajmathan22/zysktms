import { useRouter } from 'expo-router';
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

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        if (user) {
          router.replace('/(tabs)/home');
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
