declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export const GA_TRACKING_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

// Debug logging for development
const isDevelopment = process.env.NODE_ENV === 'development';

// https://developers.google.com/analytics/devguides/collection/gtagjs/pages
export const pageview = (url: string) => {
  if (typeof window !== 'undefined' && window.gtag) {
    if (isDevelopment) {
      console.log('GA Pageview:', url);
    }
    window.gtag('config', GA_TRACKING_ID, {
      page_location: url,
    });
  } else if (isDevelopment) {
    console.log('GA Pageview skipped - gtag not available:', url);
  }
};

// https://developers.google.com/analytics/devguides/collection/gtagjs/events
export const event = ({ action, category, label, value }: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (typeof window !== 'undefined' && window.gtag) {
    if (isDevelopment) {
      console.log('GA Event:', { action, category, label, value });
    }
    window.gtag('event', action, {
      event_category: category,
      event_label: label,
      value: value,
    });
  } else if (isDevelopment) {
    console.log('GA Event skipped - gtag not available:', { action, category, label, value });
  }
};

// Initialize gtag function
export const initGtag = () => {
  if (typeof window !== 'undefined') {
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_TRACKING_ID);
    
    if (isDevelopment) {
      console.log('GA Initialized with ID:', GA_TRACKING_ID);
    }
  }
}; 