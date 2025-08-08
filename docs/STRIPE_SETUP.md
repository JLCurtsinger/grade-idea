# Stripe Integration Setup Guide

This guide explains how to set up Stripe Checkout integration for GradeIdea.cc.

## 🔧 Environment Variables

Add these environment variables to your `.env.local` file and Vercel project:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_... # Your Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_... # Webhook signing secret
STRIPE_PUBLISHABLE_KEY=pk_test_... # Your Stripe publishable key

# Stripe Price IDs (create these in your Stripe dashboard)
STRIPE_PRICE_ID_STARTER=price_... # $5 for 10 tokens
STRIPE_PRICE_ID_POPULAR=price_... # $10 for 25 tokens  
STRIPE_PRICE_ID_VALUE=price_... # $20 for 60 tokens
STRIPE_PRICE_ID_BASIC=price_... # $5/mo for 12 tokens
STRIPE_PRICE_ID_STANDARD=price_... # $10/mo for 28 tokens
STRIPE_PRICE_ID_PRO=price_... # $15/mo for 45 tokens

# Firebase Admin SDK (for server-side operations)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

## 🛠️ Stripe Dashboard Setup

### 1. Create Products and Prices

In your Stripe Dashboard, create the following products and prices:

#### One-Time Products:
- **Starter Pack**: $5.00 USD, 10 tokens
- **Popular Pack**: $10.00 USD, 25 tokens  
- **Value Pack**: $20.00 USD, 60 tokens

#### Subscription Products:
- **Basic Plan**: $5.00 USD/month, 12 tokens
- **Standard Plan**: $10.00 USD/month, 28 tokens
- **Pro Plan**: $15.00 USD/month, 45 tokens

### 2. Configure Webhook Endpoint

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://your-domain.vercel.app/api/stripe-webhook`
3. Select events: `checkout.session.completed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

## 🔐 Firebase Admin SDK Setup

### 1. Generate Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download the JSON file
4. Extract the values for environment variables:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY`

### 2. Firestore Security Rules

Update your Firestore security rules to allow admin operations:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 🧪 Testing

### Local Development

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Forward Stripe webhooks to localhost:**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe-webhook
   ```

3. **Test the checkout flow:**
   - Sign in to your app
   - Click any "Subscribe" or "Buy Tokens" button
   - Complete the Stripe checkout
   - Verify tokens are added to your account

### Production Testing

1. **Use Stripe test cards:**
   - Success: `4242 4242 4242 4242`
   - Decline: `4000 0000 0000 0002`

2. **Monitor webhook events:**
   - Check Vercel function logs
   - Monitor Firestore for token updates

## 📁 File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── create-checkout-session/
│   │   │   └── route.ts          # Creates Stripe checkout sessions
│   │   └── stripe-webhook/
│   │       └── route.ts          # Handles webhook events
│   └── success/
│       └── page.tsx              # Success page after checkout
├── components/
│   └── pricing-section.tsx       # Updated with Stripe integration
├── hooks/
│   └── use-stripe-checkout.ts    # Frontend checkout hook
└── lib/
    ├── stripe.ts                 # Stripe configuration & utilities
    └── firebase-admin.ts         # Firebase Admin SDK setup
```

## 🔄 How It Works

1. **User clicks "Subscribe" or "Buy Tokens"**
   - Frontend calls `useStripeCheckout` hook
   - Hook gets Firebase ID token for authentication

2. **Create Checkout Session**
   - Frontend calls `/api/create-checkout-session`
   - API validates user and price ID
   - Creates Stripe checkout session with user ID in metadata
   - Returns checkout URL

3. **User completes payment**
   - Stripe redirects to success page
   - Stripe sends webhook to `/api/stripe-webhook`

4. **Webhook processes payment**
   - Validates webhook signature
   - Extracts user ID and price ID from session
   - Maps price ID to token count
   - Updates user's token balance in Firestore

5. **User sees updated balance**
   - Success page confirms payment
   - User can now use tokens for idea validation

## 🚨 Security Considerations

- ✅ Webhook signature verification
- ✅ Firebase ID token validation
- ✅ Input validation and sanitization
- ✅ Firestore transactions for atomic updates
- ✅ Environment variable protection
- ✅ Error handling and logging

## 🐛 Troubleshooting

### Common Issues:

1. **Webhook not receiving events:**
   - Check webhook endpoint URL in Stripe dashboard
   - Verify `STRIPE_WEBHOOK_SECRET` is correct
   - Check Vercel function logs

2. **Tokens not updating:**
   - Verify Firebase Admin SDK credentials
   - Check Firestore security rules
   - Monitor webhook function logs

3. **Checkout session creation fails:**
   - Verify `STRIPE_SECRET_KEY` is correct
   - Check price IDs exist in Stripe dashboard
   - Ensure user is authenticated

### Debug Commands:

```bash
# Test webhook locally
stripe listen --forward-to localhost:3000/api/stripe-webhook

# View Stripe logs
stripe logs tail

# Test checkout session creation
curl -X POST http://localhost:3000/api/create-checkout-session \
  -H "Content-Type: application/json" \
  -d '{"priceId":"price_...","userId":"user_..."}'
```

## 📈 Monitoring

- **Vercel Function Logs:** Monitor API route performance
- **Stripe Dashboard:** Track payments and webhook events
- **Firebase Console:** Monitor Firestore operations
- **Application Logs:** Check for errors in user flow 