import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

interface UserProfile {
  displayName?: string | null;
  photoURL?: string | null;
  email?: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  updateProfile: (displayName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null,
  loading: true, 
  isAdmin: false,
  updateProfile: async () => {} 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          setProfile(userSnap.data() as UserProfile);
        } else if (user.displayName) {
          // Initialize with Google data if it exists but doc doesn't
          const newProfile = {
            displayName: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
          };
          setProfile(newProfile);
          await setDoc(userRef, {
            ...newProfile,
            createdAt: new Date().toISOString(),
          });
        } else {
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const updateProfile = async (displayName: string) => {
    const currentUser = user || auth.currentUser;
    if (!currentUser) return;
    const userRef = doc(db, 'users', currentUser.uid);
    const newProfile = {
      displayName,
      email: currentUser.email || `${currentUser.uid}@anonymous.com`,
      photoURL: currentUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.uid}`,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(userRef, newProfile, { merge: true });
    setProfile(newProfile);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAdmin, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
