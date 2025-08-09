# Email System Implementation

## Overview

GradeIdea now includes a comprehensive transactional email system using Resend for three key user touchpoints:

1. **Welcome Email** - Sent after account creation
2. **Report Ready Email** - Sent when idea evaluation is completed
3. **Token Confirmation Email** - Sent after successful token purchase

## Architecture

### Email Utility (`src/lib/email/resend.ts`)
- Centralized Resend client configuration
- Environment variable validation
- Generic `sendEmail` function

### Email Templates (`src/lib/email/templates.ts`)
- HTML templates for each email type
- Uses `APP_BASE_URL` environment variable for links
- Simple, deliverable HTML structure

### API Routes
- `/api/email/welcome` - Welcome email endpoint
- `/api/email/report-ready` - Report ready notification
- `/api/email/token-confirmation` - Token purchase confirmation

## Environment Variables

Required in Vercel:
```bash
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=GradeIdea no-reply@gradeidea.cc
APP_BASE_URL=https://gradeidea.cc
```

## Integration Points

### 1. Welcome Email
**Location**: `src/context/AuthContext.tsx`
**Trigger**: When a new user document is created in Firestore
**Idempotency**: `users/{uid}.welcomeEmailSent = true`

```typescript
// Called after user document creation
await fetch('/api/email/welcome', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    uid: user.uid,
    email: user.email,
    name: user.displayName || '',
  }),
});
```

### 2. Report Ready Email
**Location**: `src/app/api/analyzeIdea/route.ts`
**Trigger**: After idea analysis is completed and saved to Firestore
**Idempotency**: `users/{uid}/ideas/{ideaId}.reportReadyEmailSent = true`

```typescript
// Called after idea document creation
await fetch(`${process.env.APP_BASE_URL}/api/email/report-ready`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ideaId,
    ideaTitle: ideaText.substring(0, 100),
    uid,
    email: decoded.email || '',
    dashboardPath: '/dashboard',
  }),
});
```

### 3. Token Confirmation Email
**Location**: `src/app/api/stripe-webhook/route.ts`
**Trigger**: After successful Stripe payment and token addition
**Idempotency**: `payments/{sessionId}.tokenEmailSent = true`

```typescript
// Called after token balance increment
await fetch(`${process.env.APP_BASE_URL}/api/email/token-confirmation`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: session.id,
    uid: userId,
    email: userEmail,
    tokensAdded: tokenCount,
  }),
});
```

## Idempotency Strategy

Each email type uses Firestore flags to prevent duplicate sends:

- **Welcome**: `users/{uid}.welcomeEmailSent`
- **Report Ready**: `users/{uid}/ideas/{ideaId}.reportReadyEmailSent`
- **Token Confirmation**: `payments/{sessionId}.tokenEmailSent`

## Error Handling

- Email failures don't block core functionality
- All email calls are wrapped in try-catch blocks
- Errors are logged but don't cause API failures
- Idempotency prevents duplicate sends on retries

## Testing

Use the test script to verify email functionality:

```bash
node test-email-system.js
```

## Monitoring

Check Resend dashboard for:
- Email delivery rates
- Bounce rates
- Open rates
- Click rates

## Future Enhancements

1. **Email Templates**: Consider using React Email for better template management
2. **Analytics**: Track email engagement in user analytics
3. **Preferences**: Allow users to opt out of specific email types
4. **Localization**: Support multiple languages
5. **A/B Testing**: Test different email content and timing

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**
   - Ensure `RESEND_API_KEY`, `EMAIL_FROM`, and `APP_BASE_URL` are set in Vercel

2. **Email Not Sending**
   - Check Resend API key validity
   - Verify sender domain is configured in Resend
   - Check Firestore permissions for flag updates

3. **Duplicate Emails**
   - Verify idempotency flags are being set correctly
   - Check for multiple webhook deliveries

4. **Email Delivery Issues**
   - Check Resend logs for bounces or blocks
   - Verify recipient email addresses are valid
   - Check spam folder settings

### Debug Commands

```bash
# Test email system locally
npm run dev
node test-email-system.js

# Check environment variables
echo $RESEND_API_KEY
echo $EMAIL_FROM
echo $APP_BASE_URL
```
