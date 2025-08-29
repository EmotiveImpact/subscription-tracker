# SubTracker Setup Guide

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=
API_KEY=

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PRICE_ID=price_...
STRIPE_API_VERSION=2024-06-20

# Twilio Configuration (SMS)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_MESSAGING_SERVICE_SID=
NEXT_PUBLIC_TWILIO_ENABLED=false

# Google OAuth (Gmail/Calendar)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Microsoft OAuth (Outlook)
MS_CLIENT_ID=
MS_CLIENT_SECRET=

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/dashboard

# Redis (for rate limiting)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

## Setup Steps

### 1. Clerk Authentication
1. Go to [clerk.com](https://clerk.com) and create an account
2. Create a new application
3. Copy your publishable key and secret key
4. Configure your sign-in and sign-up URLs

### 2. Stripe Setup
1. Go to [stripe.com](https://stripe.com) and create an account
2. Create a product and price for your Pro plan
3. Copy your secret key, webhook secret, and price ID
4. Set up webhook endpoints for billing events

### 3. Twilio Setup (Optional)
1. Go to [twilio.com](https://twilio.com) and create an account
2. Get your account SID, auth token, and messaging service SID
3. Set `NEXT_PUBLIC_TWILIO_ENABLED=true` when ready to use SMS

### 4. Redis Setup (Optional)
1. Go to [upstash.com](https://upstash.com) and create a Redis database
2. Copy your REST URL and token for rate limiting

## Running the Application

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up your environment variables

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features Implemented

- ✅ Clerk authentication with protected routes
- ✅ Stripe billing integration (checkout, portal, webhooks)
- ✅ User management and settings
- ✅ Subscription management with plan limits
- ✅ Rate limiting and security headers
- ✅ Responsive UI with shadcn/ui components

## Next Steps

- [ ] Gmail OAuth integration
- [ ] Outlook OAuth integration
- [ ] Google Calendar integration
- [ ] SMS verification flow
- [ ] Chrome extension
- [ ] Database integration
- [ ] Email parsing algorithms
