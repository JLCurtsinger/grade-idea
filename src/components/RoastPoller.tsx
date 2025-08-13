"use client";
import { useEffect, useState, useRef } from "react";
import { useSearchParams } from "next/navigation";

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
  
  const ready = data?.status === "ready";
  const timeoutRef = useRef<NodeJS.Timeout>();
  const startTimeRef = useRef<number>(Date.now());
  const lastPaymentStatusRef = useRef<string>('');
  const lastRoastStatusRef = useRef<string>('');
  const stageRef = useRef<'payment' | 'roast'>('payment');
  const backoffIndexRef = useRef<number>(0);
  
  // Backoff sequence (ms): [1000, 2000, 3000, 5000, 8000, 13000]
  const backoffSequence = [1000, 2000, 3000, 5000, 8000, 13000];
  
  // Add ±10% jitter to backoff
  const getJitteredDelay = (baseDelay: number) => {
    const jitter = baseDelay * 0.1;
    return baseDelay + (Math.random() * jitter * 2 - jitter);
  };
  
  // Add ±300ms jitter to payment polling
  const getPaymentJitter = () => 2000 + (Math.random() * 600 - 300);
  
  const clearCurrentTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
  };
  
  const scheduleNext = (delay: number, callback: () => void) => {
    clearCurrentTimeout();
    timeoutRef.current = setTimeout(callback, delay);
  };
  
  const checkPaymentStatus = async (): Promise<boolean> => {
    try {
      const paymentRes = await fetch(`/api/stripe-session/${sessionId}`, { cache: "no-store" });
      
      if (paymentRes.ok) {
        const paymentData = await paymentRes.json();
        const currentPaymentStatus = paymentData.paid ? 'paid' : 'not_yet';
        
        // Only log on state change
        if (currentPaymentStatus !== lastPaymentStatusRef.current) {
          console.log(`[roast][poller] payment -> ${currentPaymentStatus}`);
          lastPaymentStatusRef.current = currentPaymentStatus;
        }
        
        if (paymentData.paid) {
          console.log(`[roast][poller] Payment confirmed for session ${sessionId}, starting roast polling`);
          setStatus('processing');
          setMessage('Payment confirmed! Brewing your roast...');
          stageRef.current = 'roast';
          backoffIndexRef.current = 0;
          return true;
        }
      }
    } catch (error) {
      console.error(`[roast][poller] Payment check failed:`, error);
    }
    
    return false;
  };
  
  const pollRoast = async (): Promise<boolean> => {
    try {
      const res = await fetch(`/api/roast/${id}`, { cache: "no-store" });
      
      if (res.status === 304) {
        // Unchanged, just wait for next backoff tick
        return false;
      }
      
      if (res.status === 503) {
        // Throttled - respect Retry-After header
        const retryAfter = res.headers.get('retry-after');
        const retrySeconds = retryAfter ? parseInt(retryAfter) : 15;
        console.log(`[roast][poller] throttle -> ${retrySeconds}s`);
        setMessage('Still preparing your roast — throttling requests to avoid overload.');
        
        // Schedule next poll after retry-after delay
        scheduleNext(retrySeconds * 1000, () => pollRoast());
        return false;
      }
      
      if (res.status === 404) {
        const elapsed = Date.now() - startTimeRef.current;
        if (elapsed > 20000) {
          setStatus('not-found');
          setMessage('Still preparing your roast — this can take a moment after payment. We\'ll refresh automatically.');
          return true;
        }
        return false;
      }
      
      if (res.ok) {
        const result = await res.json();
        const currentRoastStatus = result.status || 'unknown';
        
        // Only log on state change
        if (currentRoastStatus !== lastRoastStatusRef.current) {
          console.log(`[roast][poller] roast -> ${currentRoastStatus}`);
          lastRoastStatusRef.current = currentRoastStatus;
        }
        
        if (result.status === "ready" && result.result) {
          setData(result);
          setStatus('ready');
          return true;
        } else if (result.status === "processing") {
          setStatus('processing');
          setMessage('Brewing your roast...');
        }
      }
      
      return false;
    } catch (error) {
      console.error('Roast polling error:', error);
      return false;
    }
  };
  
  const continuePolling = () => {
    const elapsed = Date.now() - startTimeRef.current;
    
    if (stageRef.current === 'payment') {
      // Stage A: Payment confirmation (max 20s)
      if (elapsed > 20000) {
        console.log(`[roast][poller] payment -> timeout, proceeding to roast polling`);
        setStatus('processing');
        setMessage('Payment confirmation timed out. Proceeding with roast generation...');
        stageRef.current = 'roast';
        backoffIndexRef.current = 0;
        scheduleNext(1000, continuePolling);
        return;
      }
      
      // Continue payment polling with jitter
      scheduleNext(getPaymentJitter(), async () => {
        const paid = await checkPaymentStatus();
        if (!paid) {
          continuePolling();
        }
      });
    } else {
      // Stage B: Roast polling (max 120s)
      if (elapsed > 120000) {
        setStatus('error');
        setMessage('Taking longer than usual. We\'ll keep trying in the background—feel free to navigate elsewhere.');
        return;
      }
      
      // Continue roast polling with backoff
      scheduleNext(getJitteredDelay(backoffSequence[backoffIndexRef.current] || 13000), async () => {
        const done = await pollRoast();
        if (!done) {
          // Increment backoff index for next iteration
          backoffIndexRef.current = Math.min(backoffIndexRef.current + 1, backoffSequence.length - 1);
          continuePolling();
        }
      });
    }
  };
  
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
    
    // Initialize state
    startTimeRef.current = Date.now();
    stageRef.current = sessionId ? 'payment' : 'roast';
    backoffIndexRef.current = 0;
    
    if (sessionId) {
      setStatus('waiting-payment');
      setMessage('Waiting for Stripe to finalize your payment…');
    }
    
    // Start polling
    continuePolling();
    
    // Cleanup on unmount
    return () => {
      clearCurrentTimeout();
    };
  }, [id, ready, sessionId]);
  
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
