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
  const [role, setRole] = useState<UserRole>(null); 
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    let unsubscribeSnapshot: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
      }

      setLoading(true);
      if (user) {
        console.log('Auth changed: User is IN. UID:', user.uid);
        setUser(user);

        const userDocRef = doc(db, 'users', user.uid);

        unsubscribeSnapshot = onSnapshot(
          userDocRef,
          (docSnap) => {
            if (docSnap.exists()) {
              const userData = docSnap.data();
              console.log('SUCCESS: User document found:', userData);
              setRole(userData.role || null);
            } else {
              console.log(
                'INFO: No user document found at path:',
                userDocRef.path
              );
              setRole(null); 
            }
            setLoading(false);
          },
          (error) => {
            console.error('FIRESTORE SNAPSHOT ERROR:', error.message);
            setRole(null); 
            setLoading(false);
          }
        );
      } else {
        console.log('Auth changed: User is OUT.');
        setUser(null);
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth(); 
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot(); 
      }
    };
  }, []);

  const logout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);

      try {
        await GoogleSignin.signOut();
      } catch (googleError) {
        console.log('Google sign out not needed or failed:', googleError);
      }

      console.log('User signed out successfully from both Firebase and Google!');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
};