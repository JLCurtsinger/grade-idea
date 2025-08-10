"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

function SuccessPageContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isLoading, setIsLoading] = useState(true);
  const { user, userName } = useAuth(); // Get userName from auth context
  const { toast } = useToast();

  useEffect(() => {
    // You could verify the session here if needed
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Send token confirmation email when component mounts
    if (user && sessionId) {
      sendTokenConfirmationEmail();
    }
  }, [user, sessionId]);

  const sendTokenConfirmationEmail = async () => {
    if (!user || !sessionId) return;

    try {
      // Get token purchase details from session (you might need to fetch this from Stripe)
      // For now, using placeholder values - you may want to fetch actual purchase details
      const response = await fetch('/api/email/token-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: user.uid,
          email: user.email,
          tokensAdded: 10, // This should come from actual purchase data
          sessionId: sessionId,
          ...(userName ? { name: userName } : {}), // Only include name if available
        }),
      });

      if (response.ok) {
        console.log('Token confirmation email sent successfully');
        toast({
          title: "Email Sent",
          description: "Token confirmation email sent to your inbox",
          variant: "default",
        });
      } else {
        throw new Error('Failed to send email');
      }
    } catch (error) {
      console.error('Error sending token confirmation email:', error);
      toast({
        title: "Email Error",
        description: "Failed to send token confirmation email",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-foreground-muted">Verifying your purchase...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="max-w-md w-full p-8 text-center">
        <div className="space-y-6">
          {/* Success Icon */}
          <div className="mx-auto w-16 h-16 bg-success/20 rounded-full flex items-center justify-center">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>

          {/* Success Message */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Payment Successful!
            </h1>
            <p className="text-foreground-muted">
              Your tokens have been added to your account. You can now start validating your ideas!
            </p>
          </div>

          {/* Session ID (for debugging) */}
          {sessionId && (
            <div className="text-xs text-foreground-subtle">
              Session ID: {sessionId}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button asChild className="w-full btn-primary">
              <Link href="/dashboard">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            
            <Button asChild variant="outline" className="w-full">
              <Link href="/">
                Back to Home
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand mx-auto mb-4"></div>
          <p className="text-foreground-muted">Loading...</p>
        </div>
      </div>
    }>
      <SuccessPageContent />
    </Suspense>
  );
} 