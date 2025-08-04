# Google Analytics Setup

This project uses Google Analytics (gtag.js) for tracking page views and custom events.

## Setup

The Google Analytics implementation is configured to:

1. **Load only in production** - GA scripts are not loaded in development mode
2. **Use environment variable** - Tracking ID is read from `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
3. **Track client-side navigation** - Automatically tracks page views on route changes
4. **SSR-safe** - All GA logic runs on the client side only

## Files Added/Modified

### New Files:
- `src/lib/gtag.ts` - Helper functions for GA tracking
- `src/components/GoogleAnalytics.tsx` - GA script loader and navigation tracker

### Modified Files:
- `src/app/layout.tsx` - Added GoogleAnalytics component
- `src/components/pricing-button.tsx` - Added example event tracking

## Usage

### Page Views
Page views are automatically tracked when users navigate between pages. No additional code needed.

### Custom Events
To track custom events, import the `event` function from `@/lib/gtag`:

```typescript
import { event } from '@/lib/gtag';

// Track a button click
event({
  action: 'button_click',
  category: 'engagement',
  label: 'pricing_button',
});

// Track a form submission
event({
  action: 'form_submit',
  category: 'form',
  label: 'contact_form',
});
```

### Event Parameters

- `action` (required): The name of the event
- `category` (required): The category of the event
- `label` (optional): Additional context for the event
- `value` (optional): Numeric value associated with the event

## Environment Variables

Make sure your `.env.local` file contains:

```
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
```

Replace `G-XXXXXXXXXX` with your actual Google Analytics Measurement ID.

## Testing

1. **Development**: GA scripts won't load, so you can develop without tracking
2. **Production**: Deploy to Vercel to test GA functionality
3. **Real-time reports**: Check Google Analytics Real-Time reports to verify tracking

## Verification

To verify GA is working:

1. Deploy to production
2. Navigate between pages
3. Check Google Analytics Real-Time reports
4. Look for page views and custom events 