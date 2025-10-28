// providers/AuthProvider.tsx

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth'; // 👈 1. Add signOut and getAuth
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebaseConfig';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>; 
  
}

// 👇 3. Add a default async function for logout
const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true, 
  logout: async () => {} ,
  
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // 👇 4. Implement the logout logic here
  const logout = async () => {
    const auth = getAuth();
    try {
      // Sign out from Firebase
      await signOut(auth);
      
      // Sign out from Google Sign-In to clear cached account
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        // User might not be signed in with Google, which is fine
        console.log('Google sign out not needed or failed:', googleError);
      }
      
      console.log('User signed out successfully from both Firebase and Google!');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    // 👇 5. Provide the logout function to the rest of your app
    <AuthContext.Provider value={{ user, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};