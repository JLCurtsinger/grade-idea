"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Mail, Lock, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "@/lib/firebase";

export const SignInModal = () => {
  const { 
    isModalOpen, 
    modalView, 
    resetCode,
    closeModal, 
    signIn, 
    signUp, 
    signInWithGoogle, 
    resetPassword,
    openModal 
  } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (modalView === 'signin') {
        await signIn(email, password);
      } else if (modalView === 'signup') {
        if (password !== confirmPassword) {
          throw new Error("Passwords don't match");
        }
        await signUp(email, password);
      } else if (modalView === 'forgot-password') {
        await resetPassword(email);
        setError("Password reset email sent! Check your inbox.");
        setTimeout(() => {
          openModal('signin');
        }, 2000);
      } else if (modalView === 'reset-password' && resetCode) {
        await verifyPasswordResetCode(auth, resetCode);
        await confirmPasswordReset(auth, resetCode, newPassword);
        setError("Password reset successful! You can now sign in.");
        setTimeout(() => {
          openModal('signin');
        }, 2000);
      }
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const switchView = (view: 'signin' | 'signup' | 'forgot-password') => {
    setError("");
    setEmail("");
    setPassword("");
    setNewPassword("");
    setConfirmPassword("");
    openModal(view);
  };

  if (!isModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md bg-surface border border-border rounded-lg shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">
            {modalView === 'signin' && 'Sign In'}
            {modalView === 'signup' && 'Create Account'}
            {modalView === 'forgot-password' && 'Reset Password'}
            {modalView === 'reset-password' && 'Set New Password'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={closeModal}
            className="text-foreground-muted hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            {/* Password Fields */}
            {(modalView === 'signin' || modalView === 'signup') && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Confirm Password for Sign Up */}
            {modalView === 'signup' && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            {/* New Password for Reset */}
            {modalView === 'reset-password' && (
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-sm font-medium">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground-muted" />
                  <Input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className="pl-10 pr-10"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg text-danger text-sm">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-brand-foreground/30 border-t-brand-foreground rounded-full animate-spin" />
              ) : (
                <>
                  {modalView === 'signin' && 'Sign In'}
                  {modalView === 'signup' && 'Create Account'}
                  {modalView === 'forgot-password' && 'Send Reset Email'}
                  {modalView === 'reset-password' && 'Reset Password'}
                </>
              )}
            </Button>

            {/* Google Sign In */}
            {(modalView === 'signin' || modalView === 'signup') && (
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-surface px-2 text-foreground-muted">Or continue with</span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>
            )}
          </form>

          {/* Footer Links */}
          <div className="mt-6 space-y-3 text-center">
            {modalView === 'signin' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => switchView('signup')}
                  className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                >
                  Don't have an account? Sign up
                </button>
                <div>
                  <button
                    type="button"
                    onClick={() => switchView('forgot-password')}
                    className="text-sm text-foreground-muted hover:text-foreground transition-colors"
                  >
                    Forgot your password?
                  </button>
                </div>
              </div>
            )}

            {modalView === 'signup' && (
              <button
                type="button"
                onClick={() => switchView('signin')}
                className="text-sm text-foreground-muted hover:text-foreground transition-colors"
              >
                Already have an account? Sign in
              </button>
            )}

            {modalView === 'forgot-password' && (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => switchView('signin')}
                  className="text-sm text-foreground-muted hover:text-foreground transition-colors flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to sign in
                </button>
              </div>
            )}

            {modalView === 'reset-password' && (
              <button
                type="button"
                onClick={() => switchView('signin')}
                className="text-sm text-foreground-muted hover:text-foreground transition-colors flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 