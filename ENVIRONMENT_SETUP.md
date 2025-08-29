# Environment Variables Setup Guide

## 🚀 Quick Start

To get the Subscription Tracker application running, you need to set up your environment variables. This guide will walk you through the process step by step.

## 📋 Prerequisites

Before you begin, make sure you have accounts and API keys for the following services:

- [Clerk](https://clerk.com) - Authentication
- [Stripe](https://stripe.com) - Payment processing
- [Vercel](https://vercel.com) - Database and hosting (optional but recommended)
- [Twilio](https://twilio.com) - SMS verification (optional)
- [Google Cloud](https://console.cloud.google.com) - OAuth integrations (optional)
- [Microsoft Azure](https://portal.azure.com) - OAuth integrations (optional)
- [Upstash](https://upstash.com) - Redis caching (optional)

## 🔧 Step-by-Step Setup

### 1. Copy Environment Template

```bash
cp env.example .env.local
```

### 2. Required Environment Variables

#### Authentication (Clerk)
```bash
# Get these from https://dashboard.clerk.com/last-active?path=api-keys
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_publishable_key_here
CLERK_SECRET_KEY=sk_test_your_clerk_secret_key_here
```

#### Payment Processing (Stripe)
```bash
# Get these from https://dashboard.stripe.com/apikeys
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key_here
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
```

#### Database (Vercel Postgres - Recommended)
```bash
# Get these from your Vercel dashboard after creating a Postgres database
POSTGRES_URL=postgresql://username:password@host:port/database
POSTGRES_HOST=your_host
POSTGRES_DATABASE=your_database
POSTGRES_USERNAME=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_PORT=5432
```

### 3. Optional Environment Variables

#### SMS Verification (Twilio)
```bash
# Get these from https://console.twilio.com/
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### OAuth Integrations (Google)
```bash
# Get these from https://console.cloud.google.com/
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
```

#### OAuth Integrations (Microsoft)
```bash
# Get these from https://portal.azure.com/
MICROSOFT_CLIENT_ID=your_client_id
MICROSOFT_CLIENT_SECRET=your_client_secret
```

#### Caching (Upstash Redis)
```bash
# Get these from https://upstash.com/
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

#### Error Tracking (Sentry)
```bash
# Get this from https://sentry.io/
SENTRY_DSN=your_sentry_dsn
```

## 🎯 Getting Started with Minimal Setup

If you want to get the app running quickly with minimal setup:

### 1. Essential Variables Only
```bash
# Copy the template
cp env.example .env.local

# Edit .env.local and fill in ONLY these required variables:
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
```

### 2. Test the Application
```bash
npm run dev
```

The app will run with in-memory storage (no database required) and basic functionality.

## 🗄️ Database Setup (Recommended)

For production use, we recommend setting up Vercel Postgres:

### 1. Create Vercel Postgres Database
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Storage tab
4. Create a new Postgres database
5. Copy the connection details

### 2. Run Database Migrations
```bash
# The app will automatically create tables on first run
# Or manually run the schema from database/schema.sql
```

## 🔍 Testing Your Setup

### 1. Check Environment Variables
```bash
# Verify your .env.local file exists and has the right variables
cat .env.local
```

### 2. Test Build
```bash
npm run build
```

### 3. Test Development Server
```bash
npm run dev
```

### 4. Test Core Features
- Sign up for a new account
- Create a test subscription
- Test the dashboard
- Verify OAuth integrations (if configured)

## 🚨 Common Issues & Solutions

### Build Fails with "Invalid Clerk Key"
- Ensure your Clerk keys are correct
- Check that you're using the right environment (test vs production)

### Database Connection Errors
- Verify your Postgres connection string
- Check that your database is accessible
- Ensure firewall rules allow connections

### Stripe Webhook Errors
- Verify your webhook secret
- Check that your Stripe keys match (test vs live)

### OAuth Integration Failures
- Verify redirect URIs are correct
- Check that APIs are enabled in your OAuth app
- Ensure scopes are properly configured

## 📚 Additional Resources

- [Clerk Documentation](https://clerk.com/docs)
- [Stripe Documentation](https://stripe.com/docs)
- [Vercel Postgres Guide](https://vercel.com/docs/storage/vercel-postgres)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

## 🆘 Need Help?

If you encounter issues:

1. Check the error messages in your terminal
2. Verify all environment variables are set correctly
3. Ensure your API keys are valid and active
4. Check the service dashboards for any account issues

## 🎉 Success!

Once you've set up your environment variables:

1. ✅ The app will build successfully
2. ✅ Authentication will work
3. ✅ Payment processing will function
4. ✅ Database operations will work (if configured)
5. ✅ OAuth integrations will work (if configured)
6. ✅ All features will be fully functional

You're ready to deploy to production! 🚀
