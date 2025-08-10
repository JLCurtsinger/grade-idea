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
import { sendWelcomeEmail as sendWelcomeEmailHelper } from '@/lib/email/client';

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

  // Helper function to send welcome email
  const sendWelcomeEmail = async (uid: string, email: string, name?: string) => {
    try {
      const result = await sendWelcomeEmailHelper({ uid, email, name });
      
      if (result.ok) {
        if (result.skipped) {
          toast({
            title: "Welcome Email Skipped",
            description: "Welcome email already sent previously",
            variant: "default",
          });
        } else {
          toast({
            title: "Welcome Email Sent",
            description: "Welcome email sent to your inbox",
            variant: "default",
          });
        }
        return { success: true, data: result };
      } else {
        toast({
          title: "Welcome Email Failed",
          description: "Failed to send welcome email",
          variant: "destructive",
        });
        return { success: false, error: result };
      }
    } catch (err) {
      console.error('[WelcomeEmail] error', err);
      toast({
        title: "Welcome Email Failed",
        description: "Failed to send welcome email",
        variant: "destructive",
      });
      return { success: false, error: err };
    }
  };

  // Helper function to save user data to Firestore
  const saveUserToFirestore = async (user: User, name: string | null, welcomeEmailSent: boolean = false) => {
    try {
      const userRef = doc(db, "users", user.uid);
      
      // Check existing welcomeEmailSent status to prevent overwriting true with false
      const existingSnap = await getDoc(userRef);
      let finalWelcomeEmailSent = welcomeEmailSent;
      
      if (existingSnap.exists()) {
        const existingData = existingSnap.data();
        // NEVER overwrite existing true welcomeEmailSent with false
        if (existingData.welcomeEmailSent === true) {
          finalWelcomeEmailSent = true;
        }
      }
      
      const userData: any = {
        uid: user.uid,
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
        welcomeEmailSent: finalWelcomeEmailSent,
      };
      
      // Only add name if it exists
      if (name) {
        userData.displayName = name;
      }
      
      await setDoc(userRef, userData, { merge: true });
      console.info(`[USER_CREATION] User: ${user.uid} | Name: ${name || 'not provided'} | Email: ${user.email} | WelcomeEmailSent: ${finalWelcomeEmailSent} (original: ${welcomeEmailSent})`);
    } catch (error) {
      console.error('[USER_CREATION] Error saving user to Firestore:', error);
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
              await saveUserToFirestore(user, name, false); // New user, welcome email not sent yet
              
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
              await sendWelcomeEmail(user.uid, user.email, name);
            } else {
              console.log(`[TOKEN_TRANSACTION] Context: onboarding | User: ${user.uid} | Skipped - user document already exists`);
              
              // Still save/update user data even if document exists (for name updates)
              // Check existing welcome email status
              const existingData = userSnap.data();
              const existingWelcomeEmailSent = existingData.welcomeEmailSent === true ? true : false;
              await saveUserToFirestore(user, name, existingWelcomeEmailSent);
            }
            
            // Clear guest scans from localStorage regardless
            localStorage.removeItem("guestScansUsed");
            
          } catch (error) {
            console.error('Error transferring guest scans:', error);
          }
        } else {
          // No guest scans to transfer, but still save user data
          // Check if user document exists to determine welcome email status
          try {
            const userRef = doc(db, "users", user.uid);
            const userSnap = await getDoc(userRef);
            const existingWelcomeEmailSent = userSnap.exists() ? (userSnap.data().welcomeEmailSent === true ? true : false) : false;
            await saveUserToFirestore(user, name, existingWelcomeEmailSent);
          } catch (error) {
            console.warn('[AuthStateChange] Error checking welcome email status, defaulting to false', { uid: user.uid, error });
            // Don't set welcomeEmailSent to false - let saveUserToFirestore handle existing status
            await saveUserToFirestore(user, name, false);
          }
        }
        
        // Handle welcome email flow for Google users who might not have gone through the sign-in flow yet
        if (user.providerData.some(provider => provider.providerId === 'google.com')) {
          console.info('[AuthStateChange] Google user detected, checking welcome email status', { uid: user.uid });
          await handleGoogleSignInWelcomeEmail(user);
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
          
          // Handle welcome email flow for redirect sign-ins
          await handleGoogleSignInWelcomeEmail(result.user);
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
      console.info('[SIGNUP] Starting email/password signup', { email, nameLength: name.trim().length });
      
      // Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      console.info('[SIGNUP] User created successfully', { uid: user.uid, email: user.email });
      
      // Update profile with display name
      if (name.trim()) {
        try {
          await updateProfile(user, { displayName: name.trim() });
          console.info('[SIGNUP] Profile updated with display name', { uid: user.uid, displayName: name.trim() });
        } catch (profileError) {
          console.warn('[SIGNUP] Failed to update profile (non-critical)', { uid: user.uid, error: profileError });
          // Continue with signup even if profile update fails
        }
      }
      
      // Check if user document already exists to determine welcome email status
      const userRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userRef);
      let existingWelcomeEmailSent = false;
      
      if (userSnap.exists()) {
        const existingData = userSnap.data();
        existingWelcomeEmailSent = existingData.welcomeEmailSent === true ? true : false;
        console.info('[SIGNUP] User document exists, checking welcome email status', { uid: user.uid, welcomeEmailSent: existingWelcomeEmailSent });
      } else {
        console.info('[SIGNUP] Creating new user document', { uid: user.uid });
      }
      
      // Save to Firestore with current welcome email status
      await saveUserToFirestore(user, name.trim(), existingWelcomeEmailSent);
      
      // Send welcome email if not already sent
      if (!existingWelcomeEmailSent) {
        console.info('[SIGNUP] Sending welcome email', { uid: user.uid, email: user.email, name: name.trim() });
        
        const welcomeResult = await sendWelcomeEmail(user.uid, user.email, name.trim());
        
        if (welcomeResult.success) {
          console.info('[SIGNUP] Welcome email sent successfully', { uid: user.uid });
          
          // Update welcomeEmailSent flag in Firestore
          await setDoc(userRef, { welcomeEmailSent: true }, { merge: true });
          console.info('[SIGNUP] Welcome email flag updated in Firestore', { uid: user.uid });
        } else {
          console.error('[SIGNUP] Welcome email failed', { uid: user.uid, error: welcomeResult.error });
        }
      } else {
        console.info('[SIGNUP] Welcome email skipped - already sent previously', { uid: user.uid });
      }
      
      console.info('[SIGNUP] Signup completed successfully', { uid: user.uid, email: user.email });
      closeModal();
    } catch (error: any) {
      console.error('[SIGNUP] Signup failed', { email, error: error.message, code: error.code });
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
        const result = await signInWithPopup(auth, provider);
        console.info('[GoogleSignIn] Popup sign-in successful', { uid: result.user.uid, email: result.user.email, displayName: result.user.displayName });
        
        // Handle welcome email flow after successful sign-in
        await handleGoogleSignInWelcomeEmail(result.user);
        
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

  // Helper function to handle welcome email flow for Google sign-in
  const handleGoogleSignInWelcomeEmail = async (user: User) => {
    try {
      console.info('[GoogleSignIn] Starting welcome email flow', { uid: user.uid, email: user.email, displayName: user.displayName });
      
      // Read user data from Firebase Auth
      const { uid, email, displayName } = user;
      
      if (!email) {
        console.error('[GoogleSignIn] No email available for welcome email', { uid });
        return;
      }

      // Upsert Firestore user document
      const userRef = doc(db, "users", uid);
      const userData: any = {
        uid,
        email,
        displayName: displayName ?? null,
        updatedAt: new Date(),
      };

      // Get existing user document to check welcomeEmailSent status
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const existingData = userSnap.data();
        // NEVER overwrite existing true welcomeEmailSent with false
        userData.welcomeEmailSent = existingData.welcomeEmailSent === true ? true : false;
        
        // Only add createdAt if it doesn't exist
        if (!existingData.createdAt) {
          userData.createdAt = new Date();
        }
        
        console.info('[GoogleSignIn] Updating existing user document', { uid, welcomeEmailSent: userData.welcomeEmailSent });
      } else {
        userData.createdAt = new Date();
        userData.welcomeEmailSent = false; // Safe for new users
        console.info('[GoogleSignIn] Creating new user document', { uid });
      }

      // Upsert user document
      await setDoc(userRef, userData, { merge: true });
      console.info('[GoogleSignIn] User document upserted successfully', { uid });

      // Check if welcome email should be sent
      if (!userData.welcomeEmailSent && email) {
        console.info('[GoogleSignIn] Sending welcome email', { uid, email, name: displayName ?? undefined });
        
        const welcomeResult = await sendWelcomeEmailHelper({ 
          uid, 
          email, 
          name: displayName ?? undefined 
        });

        if (welcomeResult.ok) {
          console.info('[GoogleSignIn] Welcome email sent successfully', { uid, emailId: welcomeResult.emailId });
          
          // Update welcomeEmailSent flag in Firestore
          await setDoc(userRef, { welcomeEmailSent: true }, { merge: true });
          console.info('[GoogleSignIn] Welcome email flag updated in Firestore', { uid });
        } else {
          console.error('[GoogleSignIn] Welcome email failed', { uid, reason: welcomeResult.reason });
        }
      } else {
        console.info('[GoogleSignIn] Welcome email skipped', { uid, reason: userData.welcomeEmailSent ? 'already-sent' : 'no-email' });
      }
    } catch (error) {
      console.error('[GoogleSignIn] Error in welcome email flow', { uid: user.uid, error });
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