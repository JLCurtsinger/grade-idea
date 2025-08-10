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
import { logInfo, logWarn, logError } from '@/lib/log';

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

  // In-memory per-session lock to prevent double calls
  const welcomeEmailLocks = new Map<string, boolean>();

  // Helper function to extract user name defensively
  const extractUserName = (user: User): string | null => {
    // Try displayName first, then fallback to reloadUserInfo
    const name = user.displayName?.trim() || (user as any)?.reloadUserInfo?.displayName?.trim();
    return name || null;
  };

  // Consolidated welcome email helper - ensures exactly one email per user
  const sendWelcomeIfNeeded = async (user: User, source: 'email' | 'google' | 'auth-state'): Promise<{
    ok: boolean;
    skipped?: boolean;
    reason?: string;
    emailId?: string;
    source: string;
  }> => {
    const { uid, email, displayName } = user;
    
    // Check session lock first
    if (welcomeEmailLocks.get(uid)) {
      logInfo('welcome email skipped - session lock active', { uid, source });
      return { ok: true, skipped: true, reason: 'session-lock', source };
    }
    
    // Set session lock
    welcomeEmailLocks.set(uid, true);
    
    try {
      logInfo('welcome email flow started', { uid, source, email, hasDisplayName: !!displayName });
      
      // Step 1: Ensure user doc exists in Firestore
      const userRef = doc(db, "users", uid);
      const userSnap = await getDoc(userRef);
      
      let userData: any = {
        uid,
        email,
        displayName: displayName ?? null,
        updatedAt: new Date(),
      };
      
      if (userSnap.exists()) {
        const existingData = userSnap.data();
        // Preserve existing welcomeEmailSent status
        userData.welcomeEmailSent = existingData.welcomeEmailSent === true ? true : false;
        
        // Only add createdAt if it doesn't exist
        if (!existingData.createdAt) {
          userData.createdAt = new Date();
        }
        
        logInfo('user document exists, checking welcome email status', { uid, welcomeEmailSent: userData.welcomeEmailSent });
      } else {
        userData.createdAt = new Date();
        userData.welcomeEmailSent = false; // Safe for new users
        logInfo('creating new user document', { uid });
      }
      
      // Upsert user document
      await setDoc(userRef, userData, { merge: true });
      logInfo('user document upserted successfully', { uid, welcomeEmailSent: userData.welcomeEmailSent });
      
      // Step 2: Check if welcome email already sent
      if (userData.welcomeEmailSent === true) {
        logInfo('welcome email skipped - already sent', { uid, source, reason: 'already-sent' });
        return { ok: true, skipped: true, reason: 'already-sent', source };
      }
      
      // Step 3: Send welcome email
      if (!email) {
        logError('no email available for welcome email', { uid, source });
        return { ok: false, reason: 'no-email', source };
      }
      
      logInfo('sending welcome email', { uid, source, email, name: displayName ?? undefined });
      
      const welcomeResult = await sendWelcomeEmailHelper({ 
        uid, 
        email, 
        name: displayName ?? undefined 
      });
      
      if (welcomeResult.ok) {
        // Step 4: Update welcomeEmailSent flag on success
        await setDoc(userRef, { welcomeEmailSent: true }, { merge: true });
        
        if (welcomeResult.skipped) {
          logInfo('welcome email skipped by API', { uid, source, reason: welcomeResult.reason });
          return { ok: true, skipped: true, reason: welcomeResult.reason, source };
        } else {
          logInfo('welcome email sent successfully', { uid, source, emailId: welcomeResult.emailId });
          
          // Show success toast
          toast({
            title: "Welcome Email Sent",
            description: "Welcome email sent to your inbox",
            variant: "default",
          });
          
          return { ok: true, emailId: welcomeResult.emailId, source };
        }
      } else {
        logError('welcome email failed', { uid, source, reason: welcomeResult.reason });
        
        // Show error toast
        toast({
          title: "Welcome Email Failed",
          description: "Could not send welcome email",
          variant: "destructive",
        });
        
        return { ok: false, reason: welcomeResult.reason, source };
      }
    } catch (error) {
      logError('welcome email flow error', { uid, source, error: error?.message || 'unknown' });
      
      // Show error toast
      toast({
        title: "Welcome Email Failed",
        description: "Could not send welcome email",
        variant: "destructive",
      });
      
      return { ok: false, reason: 'flow-error', source };
    } finally {
      // Always clear session lock
      welcomeEmailLocks.delete(uid);
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
      logInfo('user data saved to Firestore', { uid: user.uid, displayName: name || 'not provided', email: user.email, welcomeEmailSent: finalWelcomeEmailSent });
    } catch (error) {
      logError('error saving user to Firestore', { uid: user.uid, error: error?.message || 'unknown' });
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
          logInfo('user name backfilled', { uid: user.uid, displayName: authName });
        }
      }
    } catch (error) {
      logError('error backfilling user name', { uid: user.uid, error: error?.message || 'unknown' });
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
              
              logInfo('guest scans transferred to new user', { uid: user.uid, tokens: remaining, context: 'onboarding' });
              
              // Send welcome email for new users
              await sendWelcomeIfNeeded(user, 'auth-state');
            } else {
              logInfo('guest scan transfer skipped - user document exists', { uid: user.uid, context: 'onboarding' });
              
              // Still save/update user data even if document exists (for name updates)
              // Check existing welcome email status
              const existingData = userSnap.data();
              const existingWelcomeEmailSent = existingData.welcomeEmailSent === true ? true : false;
              await saveUserToFirestore(user, name, existingWelcomeEmailSent);
            }
            
            // Clear guest scans from localStorage regardless
            localStorage.removeItem("guestScansUsed");
            
          } catch (error) {
            logError('error transferring guest scans', { uid: user.uid, error: error?.message || 'unknown' });
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
            logWarn('error checking welcome email status, defaulting to false', { uid: user.uid, error: error?.message || 'unknown' });
            // Don't set welcomeEmailSent to false - let saveUserToFirestore handle existing status
            await saveUserToFirestore(user, name, false);
          }
        }
        
        // Handle welcome email flow for Google users who might not have gone through the sign-in flow yet
        // Only if we haven't already handled it in the guest scan flow above
        if (user.providerData.some(provider => provider.providerId === 'google.com')) {
          logInfo('Google user detected, checking welcome email status', { uid: user.uid });
          await sendWelcomeIfNeeded(user, 'auth-state');
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
          await sendWelcomeIfNeeded(result.user, 'google');
        }
      } catch (error: any) {
        logError('redirect result error', { error: error?.message || 'unknown' });
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
      logInfo('starting email/password signup', { email, nameLength: name.trim().length });
      
      // Create user with email/password
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      logInfo('user created successfully', { uid: user.uid, email: user.email });
      
      // Update profile with display name
      if (name.trim()) {
        try {
          await updateProfile(user, { displayName: name.trim() });
          logInfo('profile updated with display name', { uid: user.uid, displayName: name.trim() });
        } catch (profileError) {
          logWarn('failed to update profile (non-critical)', { uid: user.uid, error: profileError?.message || 'unknown' });
          // Continue with signup even if profile update fails
        }
      }
      
      // Save to Firestore first
      await saveUserToFirestore(user, name.trim(), false);
      
      // Send welcome email using consolidated helper
      logInfo('sending welcome email after signup', { uid: user.uid, email: user.email, name: name.trim() });
      await sendWelcomeIfNeeded(user, 'email');
      
      logInfo('signup completed successfully', { uid: user.uid, email: user.email });
      closeModal();
    } catch (error: any) {
      logError('signup failed', { email, error: error?.message || 'unknown', code: error?.code });
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
        logInfo('Google popup sign-in successful', { uid: result.user.uid, email: result.user.email, displayName: result.user.displayName });
        
        // Handle welcome email flow after successful sign-in
        await sendWelcomeIfNeeded(result.user, 'google');
        
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