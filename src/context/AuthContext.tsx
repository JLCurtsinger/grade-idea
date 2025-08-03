"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider, 
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isModalOpen: boolean;
  modalView: 'signin' | 'signup' | 'forgot-password' | 'reset-password';
  resetCode: string | null;
  openModal: (view?: 'signin' | 'signup' | 'forgot-password' | 'reset-password', code?: string) => void;
  closeModal: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'signin' | 'signup' | 'forgot-password' | 'reset-password'>('signin');
  const [resetCode, setResetCode] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) {
        setIsModalOpen(false);
      }
    });

    // Check for redirect result on mount
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User signed in via redirect
          setUser(result.user);
          setIsModalOpen(false);
        }
      } catch (error: any) {
        console.error('Redirect result error:', error);
      }
    };

    checkRedirectResult();

    return () => unsubscribe();
  }, []);

  const openModal = (view: 'signin' | 'signup' | 'forgot-password' | 'reset-password' = 'signin', code?: string) => {
    setModalView(view);
    if (code) {
      setResetCode(code);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalView('signin');
    setResetCode(null);
  };

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      closeModal();
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code));
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      closeModal();
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code));
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      
      // Add custom parameters to prevent popup issues
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Try popup first, fallback to redirect if popup is blocked
      try {
        await signInWithPopup(auth, provider);
        closeModal();
      } catch (popupError: any) {
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          // Fallback to redirect method
          await signInWithRedirect(auth, provider);
          // Don't close modal here as the page will redirect
        } else {
          throw popupError;
        }
      }
    } catch (error: any) {
      // Handle specific popup-related errors
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in was cancelled');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Pop-up was blocked. Please allow pop-ups for this site.');
      }
      throw new Error(getErrorMessage(error.code));
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code));
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error(getErrorMessage(error.code));
    }
  };

  const getErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Invalid email or password';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/invalid-email':
        return 'Please enter a valid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection';
      case 'auth/popup-closed-by-user':
        return 'Sign-in was cancelled';
      case 'auth/popup-blocked':
        return 'Pop-up was blocked. Please allow pop-ups for this site.';
      default:
        return 'An error occurred. Please try again';
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      isModalOpen,
      modalView,
      resetCode,
      openModal,
      closeModal,
      signIn,
      signUp,
      signInWithGoogle,
      resetPassword,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 