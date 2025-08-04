'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { GA_TRACKING_ID, pageview } from '@/lib/gtag';

export default function GoogleAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    // Track pageview on route change
    if (pathname && typeof window !== 'undefined') {
      // Wait for gtag to be available
      const trackPageview = () => {
        if (window.gtag) {
          pageview(pathname);
        } else {
          // Retry after a short delay
          setTimeout(trackPageview, 100);
        }
      };
      
      trackPageview();
    }
  }, [pathname]);

  // Only load GA if tracking ID is available
  if (!GA_TRACKING_ID) {
    if (process.env.NODE_ENV === 'development') {
      console.log('GA: No tracking ID found - skipping GA initialization');
    }
    return null;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('GA: Initializing with tracking ID:', GA_TRACKING_ID);
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
        onLoad={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('GA: gtag.js script loaded successfully');
          }
        }}
        onError={() => {
          console.error('GA: Failed to load gtag.js script');
        }}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_TRACKING_ID}', {
              page_location: window.location.href,
              send_page_view: false
            });
            console.log('GA: Initialized with ID ${GA_TRACKING_ID}');
          `,
        }}
        onLoad={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('GA: Initialization script loaded');
          }
        }}
      />
    </>
  );
} 