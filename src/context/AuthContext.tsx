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
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  userName: string | null;
  loading: boolean;
  isModalOpen: boolean;
  modalView: 'signin' | 'signup' | 'forgot-password' | 'reset-password';
  resetCode: string | null;
  openModal: (view?: 'signin' | 'signup' | 'forgot-password' | 'reset-password', code?: string) => void;
  closeModal: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
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
  const [userName, setUserName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalView, setModalView] = useState<'signin' | 'signup' | 'forgot-password' | 'reset-password'>('signin');
  const [resetCode, setResetCode] = useState<string | null>(null);

  // Helper function to extract user name defensively
  const extractUserName = (user: User): string | null => {
    // Try displayName first, then fallback to reloadUserInfo
    const name = user.displayName?.trim() || (user as any)?.reloadUserInfo?.displayName?.trim();
    return name || null;
  };

  // Helper function to save user data to Firestore
  const saveUserToFirestore = async (user: User, name: string | null) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userData: any = {
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      // Only add name if it exists
      if (name) {
        userData.displayName = name;
      }
      
      await setDoc(userRef, userData, { merge: true });
      console.log(`[USER_CREATION] User: ${user.uid} | Name: ${name || 'not provided'} | Email: ${user.email}`);
    } catch (error) {
      console.error('Error saving user to Firestore:', error);
    }
  };

  // Helper function to backfill missing names from Auth to Firestore
  const backfillUserName = async (user: User) => {
    try {
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const firestoreName = userData.displayName;
        const authName = user.displayName;
        
        // Only backfill if Firestore has no name but Auth does
        if (!firestoreName && authName) {
          await setDoc(userRef, { 
            displayName: authName,
            updatedAt: new Date()
          }, { merge: true });
          console.log(`[NAME_BACKFILL] User: ${user.uid} | Backfilled name: ${authName}`);
        }
      }
    } catch (error) {
      console.error('Error backfilling user name:', error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // Extract and set user name
        const name = extractUserName(user);
        setUserName(name);
        
        setIsModalOpen(false);
        
        // Backfill name if needed (non-breaking)
        await backfillUserName(user);
        
        // Transfer guest scans to user account - ONLY if user document doesn't exist
        const guestScansUsed = parseInt(localStorage.getItem("guestScansUsed") || "0", 10);
        const remaining = Math.max(0, 2 - guestScansUsed);
        
        if (remaining > 0) {
          try {
            const userRef = doc(db, "users", user.uid);
            
            // Check if user document already exists
            const userSnap = await getDoc(userRef);
            
            if (!userSnap.exists()) {
              // Save user data to Firestore first
              await saveUserToFirestore(user, name);
              
              // Then create user document with tokens
              await setDoc(userRef, { 
                token_balance: remaining,
                created_at: new Date(),
                updated_at: new Date(),
                last_token_source: 'onboarding'
              }, { merge: true });
              
              console.log(`[TOKEN_TRANSACTION] Context: onboarding | User: ${user.uid} | Tokens: ${remaining}`);
              console.log(`Transferred ${remaining} free scans to new user account`);
              
              // Send welcome email for new users
              try {
                await fetch('/api/email/welcome', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    uid: user.uid,
                    email: user.email,
                    ...(name ? { name } : {}), // Only include name if present
                  }),
                });
                console.log(`Welcome email sent to ${user.email}`);
                toast({
                  title: "Welcome Email Sent",
                  description: "Welcome email sent to your inbox",
                  variant: "default",
                });
              } catch (emailError) {
                console.error('Error sending welcome email:', emailError);
                toast({
                  title: "Welcome Email Failed",
                  description: "Failed to send welcome email",
                  variant: "destructive",
                });
                // Don't fail user creation for email errors
              }
            } else {
              console.log(`[TOKEN_TRANSACTION] Context: onboarding | User: ${user.uid} | Skipped - user document already exists`);
              
              // Still save/update user data even if document exists (for name updates)
              await saveUserToFirestore(user, name);
            }
            
            // Clear guest scans from localStorage regardless
            localStorage.removeItem("guestScansUsed");
            
          } catch (error) {
            console.error('Error transferring guest scans:', error);
          }
        } else {
          // No guest scans to transfer, but still save user data
          await saveUserToFirestore(user, name);
        }
      } else {
        // User signed out, clear userName
        setUserName(null);
      }
      
      setLoading(false);
    });

    // Check for redirect result on mount
    const checkRedirectResult = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result) {
          // User signed in via redirect
          setUser(result.user);
          
          // Extract and set user name for redirect sign-ins
          const name = extractUserName(result.user);
          setUserName(name);
          
          setIsModalOpen(false);
          
          // Backfill name if needed for redirect users
          await backfillUserName(result.user);
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

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      // Update profile with display name
      if (name.trim()) {
        await updateProfile(user, { displayName: name.trim() });
      }
      
      // Save to Firestore
      await saveUserToFirestore(user, name.trim());
      
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
      userName,
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