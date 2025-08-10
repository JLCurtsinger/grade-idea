"use client";

import { useEffect, Suspense } from "react";
import Head from 'next/head';
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const { openModal } = useAuth();

  useEffect(() => {
    const oobCode = searchParams.get('oobCode');
    const mode = searchParams.get('mode');

    if (oobCode && mode === 'resetPassword') {
      // Open the modal in reset-password mode with the code
      openModal('reset-password', oobCode);
    } else if (oobCode) {
      // If there's a code but no mode, still try to open reset modal
      openModal('reset-password', oobCode);
    }
  }, [searchParams, openModal]);

  return (
    <>
      <Head>
        <link rel="canonical" href="https://gradeidea.cc/reset-password" />
      </Head>
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Processing Password Reset</h1>
          <p className="text-foreground-muted">
            Please wait while we process your password reset request...
          </p>
        </div>
      </div>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-foreground">Loading...</h1>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
} 