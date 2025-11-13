// src/screens/auth/LoginScreen.tsx
import { Ionicons } from '@expo/vector-icons';
import {
  GoogleSignin
} from '@react-native-google-signin/google-signin';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../constants/Colors';
import { useAuth } from '../../hooks/useAuth';
import { useAuthContext } from '../../providers/AuthProvider';

GoogleSignin.configure({
  webClientId: '394617112523-oer8g5es7dgmcdg7nsr05tv85nt4517n.apps.googleusercontent.com',
  forceCodeForRefreshToken: true, 
});
const LoginScreen = () => {
  console.log('LoginScreen rendered');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signInWithEmail, signInWithGoogle, signInWithGitHub, loading, error } = useAuth();
  const { user } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/(tabs)/home');
    }
  }, [user, router]);

  const handleLogin = () => {
    console.log('handleLogin called');
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password.');
      return;
    }
    signInWithEmail(email, password);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header Section */}
        

        {/* Logo Section */}
        <View style={styles.logoSection}>
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <Image source={require('../../assets/images/zysk-mobile-logo.png')} />
        </View>
      </View>
    </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.inputLabel}>Email or Phone Number</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={Colors.grey} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="example@gmail.com"
              placeholderTextColor={Colors.grey}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} style={styles.inputRightIcon} />
          </View>

          <Text style={styles.inputLabel}>Password</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={Colors.grey} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="••••••••••"
              placeholderTextColor={Colors.grey}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity style={styles.inputRightIcon}>
              <Text style={styles.showText}>Show</Text>
            </TouchableOpacity>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity style={styles.signInButton} onPress={handleLogin}>
            <Text style={styles.signInButtonText}>Sign In</Text>
          </TouchableOpacity>

          <Text style={styles.dividerText}>You can Connect with</Text>

          <View style={styles.socialButtonsContainer}>
            <TouchableOpacity style={styles.socialButton} onPress={signInWithGoogle}>
              <Ionicons name="logo-google" size={24} color={Colors.googleIcon} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton} onPress={signInWithGitHub}>
              <Ionicons name="logo-github" size={24} color={Colors.black} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.socialButton}>
              <Ionicons name="logo-apple" size={24} color={Colors.appleIcon} />
            </TouchableOpacity>
          </View>

          <View style={styles.signUpSection}>
            <Text style={styles.signUpText}>
              Don't have an account? 
              <Text style={styles.signUpLink}>Sign Up here</Text>
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop:50
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  headerSection: {
    alignItems: 'flex-start',
    marginBottom: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.titleColor,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.subtitleColor,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoIcon: {
    width: 60,
    height: 60,
    position: 'relative',
    marginBottom: 8,
  },
  orangeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.orangeCircle,
    position: 'absolute',
    top: 15,
    left: 0,
  },
  blueTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 15,
    borderRightWidth: 15,
    borderBottomWidth: 26,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: Colors.blue,
    position: 'absolute',
    top: 4,
    right: 0,
  },
  logoText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.logotext,
    letterSpacing: 1,
  },
  formSection: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.logotext,
    marginBottom: 8,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.logotext,
  },
  inputRightIcon: {
    marginLeft: 12,
  },
  showText: {
    fontSize: 14,
    color: Colors.logintext,
    fontWeight: '500',
  },
  errorText: {
    color: Colors.error,
    fontSize: 14,
    marginBottom: 16,
  },
  signInButton: {
    backgroundColor: Colors.blue,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  signInButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  dividerText: {
    textAlign: 'center',
    color: Colors.subtitleColor,
    fontSize: 14,
    marginBottom: 20,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 30,
  },
  socialButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    ...Platform.select({
      ios: {
        shadowColor: Colors.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  signUpSection: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  signUpText: {
    fontSize: 14,
    color: Colors.subtitleColor,
  },
  signUpLink: {
    color: Colors.orangeCircle,
    fontWeight: '500',
  },
});

export default LoginScreen;