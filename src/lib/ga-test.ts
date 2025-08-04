// Google Analytics Test Utility
// This file helps verify that GA is working correctly

export const testGA = () => {
  if (typeof window === 'undefined') {
    console.log('GA Test: Running on server side');
    return;
  }

  console.log('GA Test: Running on client side');
  
  // Check if tracking ID is available
  const trackingId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
  console.log('GA Test: Tracking ID:', trackingId);
  
  // Check if gtag function exists
  if (window.gtag) {
    console.log('GA Test: gtag function is available');
    
    // Test a custom event
    window.gtag('event', 'test_event', {
      event_category: 'test',
      event_label: 'ga_test',
      value: 1
    });
    console.log('GA Test: Custom event sent');
  } else {
    console.log('GA Test: gtag function is NOT available');
  }
  
  // Check if dataLayer exists
  if (window.dataLayer) {
    console.log('GA Test: dataLayer is available, length:', window.dataLayer.length);
    console.log('GA Test: dataLayer contents:', window.dataLayer);
  } else {
    console.log('GA Test: dataLayer is NOT available');
  }
  
  // Check for network requests to Google Analytics
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.name.includes('google-analytics.com') || entry.name.includes('googletagmanager.com')) {
        console.log('GA Test: Network request to GA:', entry.name);
      }
    }
  });
  
  observer.observe({ entryTypes: ['resource'] });
  
  // Test pageview tracking
  setTimeout(() => {
    if (window.gtag) {
      window.gtag('config', trackingId, {
        page_location: window.location.href,
        page_title: document.title
      });
      console.log('GA Test: Pageview event sent');
    }
  }, 1000);
};

// Auto-run test in development
if (process.env.NODE_ENV === 'development') {
  setTimeout(testGA, 2000);
} 