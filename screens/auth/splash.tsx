import * as LocalAuthentication from 'expo-local-authentication';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import LottieView from 'lottie-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuthContext } from '../../providers/AuthProvider';

const SplashScreen = () => {
  const { user, loading } = useAuthContext();
  const router = useRouter();


  const tryBiometricUnlock = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const hasEnrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (!hasHardware || !hasEnrolled) {
      return true;
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock to continue',
    });
    
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
      }, 1500); 

      return () => clearTimeout(timer);
    }
  }, [user, loading, router]);

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../../assets/animations/splash.json')}
        autoPlay
        loop
        style={styles.lottie} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  lottie: {
    width: 300,  
    height: 300, 
  },
});

export default SplashScreen;