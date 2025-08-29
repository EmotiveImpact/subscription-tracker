# Vercel Postgres Setup Guide

This guide will help you set up Vercel Postgres as the database for your Subscription Tracker application. Vercel Postgres is much faster to set up than Supabase and integrates natively with Vercel deployments.

## 🚀 Quick Start (5 minutes!)

### 1. Create Vercel Postgres Database

1. **Go to your Vercel dashboard** at [vercel.com/dashboard](https://vercel.com/dashboard)
2. **Click "Storage"** in the left sidebar
3. **Click "Create Database"**
4. **Select "Postgres"**
5. **Choose your plan:**
   - **Hobby**: Free tier (512MB, perfect for development)
   - **Pro**: $20/month (8GB, for production apps)
6. **Select region** (choose closest to your users)
7. **Click "Create"**

That's it! Your database is created in under 2 minutes.

### 2. Get Your Connection Details

1. **Click on your new database** in the Storage section
2. **Go to "Settings" tab**
3. **Copy the connection details:**
   - **Connection String** (starts with `postgresql://`)
   - **Host, Database, Username, Password, Port**

### 3. Update Environment Variables

1. **Copy `env.example` to `.env.local`:**
   ```bash
   cp env.example .env.local
   ```

2. **Add your Vercel Postgres credentials to `.env.local`:**
   ```bash
   # Option 1: Use connection string (recommended)
   POSTGRES_URL=postgresql://username:password@host:port/database
   
   # Option 2: Use individual variables
   POSTGRES_HOST=your_host.vercel-storage.com
   POSTGRES_DATABASE=verceldb
   POSTGRES_USERNAME=default
   POSTGRES_PASSWORD=your_password
   POSTGRES_PORT=5432
   ```

### 4. Run Database Migrations

1. **Go to your Vercel dashboard**
2. **Click on your database**
3. **Go to "Query" tab**
4. **Copy the contents of `supabase/migrations/001_initial_schema.sql`**
5. **Paste it into the query editor and click "Run"**

### 5. Test the Application

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Check the console for "Using Vercel Postgres database storage" message**
3. **Test creating a subscription** - it should now be stored in Vercel Postgres

## 🔧 Advanced Configuration

### Environment Variables

The app automatically detects Vercel Postgres when these variables are set:
- **`POSTGRES_URL`**: Full connection string (preferred)
- **`POSTGRES_HOST` + `POSTGRES_DATABASE` + etc.**: Individual connection details

### Database Schema

The migration script creates:
- **subscriptions**: User subscription data
- **merchants**: Merchant information
- **discoveries**: Subscription discoveries
- **user_settings**: User preferences and settings
- **user_profiles**: User profile information

### Automatic Fallback

The app automatically falls back to in-memory storage if:
- No Vercel Postgres environment variables are set
- Database connection fails
- Database is not accessible

## 🚨 Troubleshooting

### Common Issues

1. **"Using in-memory storage" message**
   - Check that `POSTGRES_URL` or `POSTGRES_HOST` are set correctly
   - Ensure the environment variables are in `.env.local` (not `.env`)
   - Verify the database is active in your Vercel dashboard

2. **Database connection errors**
   - Verify your Vercel Postgres database is active
   - Check that the connection string/credentials are correct
   - Ensure your IP is not blocked (Vercel Postgres is accessible from anywhere)

3. **Migration errors**
   - The schema is idempotent - you can run it multiple times
   - Check the Vercel Postgres logs for specific error messages

### Debug Mode

To see detailed database operations, check the browser console for:
- "Using Vercel Postgres database storage" message
- Any error messages from database operations

## 🔒 Security Features

### Connection Security

- **SSL by default**: All connections use SSL encryption
- **Vercel managed**: No need to manage database security yourself
- **Automatic backups**: Vercel handles backups and updates

### Data Isolation

The database schema includes proper user isolation:
- Each user can only access their own data
- No cross-user data leakage
- Proper indexing for performance

## 📊 Monitoring & Management

### Vercel Dashboard

Monitor your database in the Vercel dashboard:
- **Storage section**: View database status and usage
- **Query tab**: Run SQL queries and view results
- **Settings tab**: Manage connection details and scaling

### Automatic Scaling

Vercel Postgres automatically:
- Scales based on usage
- Handles connection pooling
- Manages performance optimization

## 🚀 Production Deployment

### Vercel Integration

1. **Add your environment variables to Vercel:**
   - Go to your Vercel project settings
   - Add all the `POSTGRES_*` variables
   - Redeploy your application

2. **Database is automatically connected** to your Vercel deployment

### Scaling

- **Hobby plan**: Perfect for development and small apps
- **Pro plan**: For production apps with more users
- **Enterprise**: For large-scale applications

## 🔄 Migration from In-Memory Storage

The application automatically detects whether to use database or in-memory storage:

- **With Vercel Postgres**: Uses database storage
- **Without Vercel Postgres**: Falls back to in-memory storage

This means you can:
1. Start with in-memory storage
2. Add Vercel Postgres later
3. Switch seamlessly between the two

## 💰 Pricing

### Hobby Plan (Free)
- **Storage**: 512MB
- **Connections**: 100 concurrent
- **Perfect for**: Development, testing, small apps

### Pro Plan ($20/month)
- **Storage**: 8GB
- **Connections**: 500 concurrent
- **Perfect for**: Production apps, growing user base

### Enterprise Plan
- **Custom pricing** for large-scale applications
- **Dedicated support** and advanced features

## 📚 Additional Resources

- [Vercel Postgres Documentation](https://vercel.com/docs/storage/vercel-postgres)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Vercel Storage Pricing](https://vercel.com/docs/storage/vercel-postgres/pricing)

## 🆘 Support

If you encounter issues:

1. **Check Vercel Status**: [vercel-status.com](https://vercel-status.com)
2. **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
3. **Application logs**: Check browser console for error messages
4. **Database logs**: Check Vercel Postgres logs in dashboard

---

**Note**: Vercel Postgres is the fastest way to get a production-ready database. Setup takes under 5 minutes, and it integrates seamlessly with Vercel deployments. The application automatically uses the database when configured, falling back to in-memory storage when not available.
