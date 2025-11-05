// config/firebaseConfig.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import {
    browserLocalPersistence,
    getAuth,
    initializeAuth,
    setPersistence,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';



const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_APP_ID,
};


const app = initializeApp(firebaseConfig);
console.log('Firebase initialized');

let authInstance: Auth;
const getReactNativePersistence: any = (require('firebase/auth') as any)
  .getReactNativePersistence;
if (Platform.OS === 'web') {
  authInstance = getAuth(app);
  void setPersistence(authInstance, browserLocalPersistence);
} else {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
}

export const auth = authInstance;

export const db = getFirestore(app);