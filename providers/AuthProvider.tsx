// providers/AuthProvider.tsx

import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getAuth, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebaseConfig';

export type UserRole = 'admin' | 'moderator' | 'user' | null;

interface AuthContextType {
  user: User | null;
  role: UserRole; 
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null, 
  loading: true,
  logout: async () => {},
});

export const useAuthContext = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>(null); // 👈 4. Add state for role
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // 2. CRITICAL FIX: Unsubscribe from any *previous* listener
      // This "hangs up" the old listener *before* auth state changes
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }

      setLoading(true);
      if (user) {
        // --- DEBUG LOG 1 ---
        console.log('Auth changed: User is IN. UID:', user.uid);
        setUser(user);

        const userDocRef = doc(db, 'users', user.uid);

        // 3. Assign the new listener to the *outer* variable
        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              // --- DEBUG LOG 2 ---
              console.log('SUCCESS: User document found:', userData);
              setRole(userData.role || null);
            } else {
              console.log(
                'INFO: No user document found at path:',
                userDocRef.path
              );
              setRole(null); // No document, so no role
            }
            setLoading(false);
          },
          (error) => {
            // --- DEBUG LOG 4 (CRITICAL) ---
            console.error('FIRESTORE SNAPSHOT ERROR:', error.message);
            setRole(null); // Error fetching, so no role
            setLoading(false);
          }
        );
      } else {
        // --- DEBUG LOG 5 ---
        console.log('Auth changed: User is OUT.');
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    // 4. Main cleanup (when the whole provider unmounts)
    return () => {
      unsubscribeAuth(); // Unsubscribe from auth listener
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot(); // Unsubscribe from snapshot listener
      }
    };
  }, []);

  const logout = async () => {
    const auth = getAuth();
    try {
      // Sign out from Firebase
      await signOut(auth);

      // Sign out from Google Sign-In to clear cached account
      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        console.log('Google sign out not needed or failed:', googleError);
      }

      console.log('User signed out successfully from both Firebase and Google!');
      // The onAuthStateChanged listener will handle setting user/role to null
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    // 👇 6. Provide the new 'role' value to your app
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};