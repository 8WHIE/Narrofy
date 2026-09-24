import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { onAuthChange, logoutUser } from '../firebase/auth';
import { getUserProfile, updateUserProfile } from '../firebase/firestore';
import { isFirebaseConfigured, testConnection } from '../firebase/config';
import { UserProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isConfigured: boolean;
  connectionStatus: { tested: boolean; success: boolean; message: string };
  authModalOpen: boolean;
  authModalMode: 'signin' | 'signup' | 'forgot';
  openAuthModal: (mode?: 'signin' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;
  configModalOpen: boolean;
  openConfigModal: () => void;
  closeConfigModal: () => void;
  onboardingOpen: boolean;
  setOnboardingOpen: (val: boolean) => void;
  refreshProfile: () => Promise<void>;
  updateUserCategories: (categories: string[]) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigured, setIsConfigured] = useState<boolean>(isFirebaseConfigured());
  const [connectionStatus, setConnectionStatus] = useState<{ tested: boolean; success: boolean; message: string }>({
    tested: false,
    success: false,
    message: '',
  });

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [configModalOpen, setConfigModalOpen] = useState<boolean>(false);
  const [onboardingOpen, setOnboardingOpen] = useState<boolean>(false);

  const fetchProfile = async (uid: string) => {
    try {
      const p = await getUserProfile(uid);
      setProfile(p);
      if (p && (!p.selectedCategories || p.selectedCategories.length === 0)) {
        setOnboardingOpen(true);
      }
    } catch (e) {
      console.warn('Failed to load user profile from Firestore:', e);
    }
  };

  useEffect(() => {
    setIsConfigured(isFirebaseConfigured());

    if (isFirebaseConfigured()) {
      testConnection().then((res) => {
        setConnectionStatus({ tested: true, success: res.success, message: res.message });
      });
    }

    const unsub = onAuthChange(async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await fetchProfile(firebaseUser.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const openAuthModal = (mode: 'signin' | 'signup' | 'forgot' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => setAuthModalOpen(false);
  const openConfigModal = () => setConfigModalOpen(true);
  const closeConfigModal = () => setConfigModalOpen(false);

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.uid);
    }
  };

  const updateUserCategories = async (categories: string[]) => {
    if (!user) return;
    await updateUserProfile(user.uid, { selectedCategories: categories });
    if (profile) {
      setProfile({ ...profile, selectedCategories: categories });
    }
  };

  const logout = async () => {
    await logoutUser();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        isConfigured,
        connectionStatus,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        configModalOpen,
        openConfigModal,
        closeConfigModal,
        onboardingOpen,
        setOnboardingOpen,
        refreshProfile,
        updateUserCategories,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
