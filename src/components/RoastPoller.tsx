"use client";
import { useEffect, useState, useRef } from "react";

export default function RoastPoller({ 
  id, 
  initial, 
  sessionId 
}: { 
  id: string; 
  initial: any; 
  sessionId?: string | null;
}) {
  const [data, setData] = useState(initial);
  const [status, setStatus] = useState<'processing' | 'ready' | 'error' | 'not-found' | 'waiting-payment'>('processing');
  const [message, setMessage] = useState<string>('');
  const [showPaymentBanner, setShowPaymentBanner] = useState(false);
  
  const pollCount = useRef(0);
  const maxPolls = 90; // 90 seconds max
  const pollInterval = 1000; // 1 second base interval
  const paymentTimeout = 30000; // 30 seconds for payment confirmation
  
  const ready = data?.status === "ready";
  
  useEffect(() => {
    if (ready) return;
    
    // Show payment processing banner for 15s if session_id is present
    if (sessionId) {
      setShowPaymentBanner(true);
      const timer = setTimeout(() => {
        setShowPaymentBanner(false);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [sessionId, ready]);
  
  useEffect(() => {
    if (ready) return;
    
    let timeoutId: NodeJS.Timeout;
    let startTime = Date.now();
    let lastPaymentStatus = '';
    let lastRoastStatus = '';
    
    const poll = async () => {
      try {
        // If we have a session_id, first check payment status
        if (sessionId && status === 'waiting-payment') {
          const paymentRes = await fetch(`/api/stripe-session/${sessionId}`, { cache: "no-store" });
          
          if (paymentRes.ok) {
            const paymentData = await paymentRes.json();
            const currentPaymentStatus = paymentData.paid ? 'paid' : 'not_yet';
            
            // Only log on state change
            if (currentPaymentStatus !== lastPaymentStatus) {
              console.log(`[roast][poller] payment -> ${currentPaymentStatus}`);
              lastPaymentStatus = currentPaymentStatus;
            }
            
            if (paymentData.paid) {
              setStatus('processing');
              setMessage('Payment confirmed! Brewing your roast...');
              // Continue to roast polling below
            } else {
              // Still waiting for payment
              const elapsed = Date.now() - startTime;
              if (elapsed > paymentTimeout) {
                setStatus('error');
                setMessage('Payment confirmation timed out. Please contact support.');
                return;
              }
              
              // Continue waiting for payment
              timeoutId = setTimeout(poll, 1000);
              return;
            }
          } else {
            console.error(`[roast][poller] Failed to check payment status: ${paymentRes.status}`);
            // Fall back to roast polling if payment check fails
            setStatus('processing');
          }
        }
        
        // Poll for roast results
        const res = await fetch(`/api/roast/${id}`, { cache: "no-store" });
        
        if (res.status === 404) {
          // Check if we've been polling for more than 20 seconds
          const elapsed = Date.now() - startTime;
          if (elapsed > 20000) {
            setStatus('not-found');
            setMessage('Still preparing your roast — this can take a moment after payment. We\'ll refresh automatically.');
            return;
          }
        } else if (res.ok) {
          const result = await res.json();
          const currentRoastStatus = result.status || 'unknown';
          
          // Only log on state change
          if (currentRoastStatus !== lastRoastStatus) {
            console.log(`[roast][poller] roast -> ${currentRoastStatus}`);
            lastRoastStatus = currentRoastStatus;
          }
          
          if (result.status === "ready" && result.result) {
            setData(result);
            setStatus('ready');
            return;
          } else if (result.status === "processing") {
            setStatus('processing');
            setMessage('Brewing your roast...');
          }
        }
        
        // Continue polling if not ready
        pollCount.current++;
        const elapsed = Date.now() - startTime;
        
        if (pollCount.current >= maxPolls || elapsed >= 90000) {
          setStatus('error');
          setMessage('Roast generation timed out. Please refresh the page.');
          return;
        }
        
        // Exponential backoff after first 10 attempts
        let delay = pollInterval;
        if (pollCount.current > 10) {
          delay = Math.min(pollInterval * Math.pow(1.5, pollCount.current - 10), 5000);
        }
        
        timeoutId = setTimeout(poll, delay);
      } catch (error) {
        console.error('Polling error:', error);
        setStatus('error');
        setMessage('Error checking roast status. Please refresh the page.');
      }
    };
    
    // Start polling - if we have session_id, start with payment check
    if (sessionId) {
      setStatus('waiting-payment');
      setMessage('Waiting for Stripe to finalize your payment...');
    }
    
    poll();
    
    // Cleanup on unmount
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [id, ready, sessionId, status]);
  
  // Render payment processing banner
  if (showPaymentBanner) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-800">Processing your payment...</span>
        </div>
      </div>
    );
  }
  
  // Render status messages
  if (status === 'waiting-payment' && message) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-3"></div>
          <span className="text-blue-800">{message}</span>
        </div>
      </div>
    );
  }
  
  if (status === 'processing' && message) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600 mr-3"></div>
          <span className="text-yellow-800">{message}</span>
        </div>
      </div>
    );
  }
  
  if (status === 'not-found') {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
        <span className="text-orange-800">{message}</span>
      </div>
    );
  }
  
  if (status === 'error') {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <span className="text-red-800">{message}</span>
      </div>
    );
  }
  
  // render the same #roast-card layout as the page or nothing if already in page
  return null;
}
