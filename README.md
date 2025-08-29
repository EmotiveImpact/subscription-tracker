# Subscription Tracker

A modern, production-ready Next.js 15 web application for comprehensive subscription management. Built with React 18, TypeScript, Tailwind CSS, and integrated with Stripe for billing, Clerk for authentication, and Twilio for SMS notifications.

## 🚀 Features

### Core Functionality
- **Subscription Management**: Track, organize, and manage all your subscriptions in one place
- **Smart Discovery**: Automatically detect subscriptions from Gmail, Outlook, and receipt scanning
- **Dashboard Analytics**: Comprehensive insights into your subscription spending and usage
- **Cancellation Management**: Easy subscription cancellation with difficulty ratings and instructions
- **Smart Notifications**: Billing reminders, trial expiration alerts, price change notifications

### Integrations
- **Email Integration**: Gmail and Outlook OAuth integration for automatic subscription discovery
- **Calendar Integration**: Google Calendar sync for subscription renewals and billing dates
- **SMS Notifications**: Twilio integration for SMS alerts (Pro plan only)
- **Chrome Extension**: Manifest V3 extension for real-time subscription detection while browsing

### Plans & Pricing
- **Free Plan**: 1 subscription limit
- **Pro Plan**: Unlimited subscriptions, SMS notifications, advanced integrations

## 🛠️ Tech Stack

- **Framework**: Next.js 15.1.0 (App Router)
- **Frontend**: React 18.3.1, TypeScript 5.6.0
- **Styling**: Tailwind CSS 3.4.4, shadcn/ui components
- **Authentication**: Clerk
- **Billing**: Stripe
- **SMS**: Twilio
- **Database**: In-memory storage (development), ready for production database
- **Deployment**: Vercel-ready

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   │   ├── billing/       # Stripe billing endpoints
│   │   ├── discoveries/   # Subscription discovery endpoints
│   │   ├── integrations/  # OAuth integration endpoints
│   │   └── sms/          # SMS verification endpoints
│   ├── dashboard/         # Main dashboard
│   ├── discoveries/       # Subscription discoveries page
│   ├── settings/          # User settings and integrations
│   ├── sign-in/          # Clerk sign-in page
│   └── sign-up/          # Clerk sign-up page
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   └── Navigation.tsx    # Main navigation
├── contexts/              # React contexts
│   └── user-context.tsx  # User profile and settings context
├── hooks/                 # Custom React hooks
├── lib/                   # Utility libraries
└── types/                 # TypeScript type definitions

extension/                  # Chrome extension
├── manifest.json          # Extension manifest
├── background.js          # Service worker
├── content.js             # Content script
├── popup.html             # Extension popup UI
├── popup.js               # Popup functionality
└── injected.js            # Page injection script
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Stripe account
- Clerk account
- Twilio account (optional)

### Environment Variables

Create a `.env.local` file with the following variables:

```bash
# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Stripe Billing
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PRICE_ID=your_stripe_price_id
STRIPE_API_VERSION=2024-06-20

# Twilio SMS (optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_MESSAGING_SERVICE_SID=your_twilio_messaging_service_sid
NEXT_PUBLIC_TWILIO_ENABLED=false

# Google OAuth (for Gmail/Calendar)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Microsoft OAuth (for Outlook)
MS_CLIENT_ID=your_microsoft_client_id
MS_CLIENT_SECRET=your_microsoft_client_secret
```

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd subscription-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

### Building for Production

```bash
npm run build
npm start
```

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run type-check` - Run TypeScript type checking

### Code Quality

- **ESLint**: Configured with Next.js recommended rules
- **Prettier**: Code formatting with Tailwind CSS class sorting
- **TypeScript**: Strict mode enabled for type safety
- **Conventional Commits**: Git commit message standards

## 🔌 API Endpoints

### Billing
- `POST /api/billing/checkout` - Create Stripe checkout session
- `POST /api/billing/portal` - Redirect to Stripe customer portal
- `POST /api/billing/webhook` - Handle Stripe webhooks
- `GET /api/billing/customer` - Get Stripe customer data
- `POST /api/billing/customer` - Create Stripe customer

### Discoveries
- `GET /api/discoveries` - Get user's subscription discoveries
- `POST /api/discoveries` - Create new discovery
- `POST /api/discoveries/[id]/actions` - Confirm/ignore/convert discovery

### Integrations
- `GET /api/integrations/gmail/auth` - Gmail OAuth flow
- `POST /api/integrations/gmail/parse` - Parse Gmail emails
- `GET /api/integrations/outlook/auth` - Outlook OAuth flow
- `GET /api/integrations/calendar/auth` - Google Calendar OAuth

### SMS
- `POST /api/sms/verify` - Send SMS verification code

## 🌐 Chrome Extension

The Chrome extension automatically detects subscriptions while browsing:

1. **Installation**: Load the `extension/` folder as an unpacked extension
2. **Features**: 
   - Real-time subscription detection
   - Automatic merchant and pricing extraction
   - Integration with web app
   - Popup dashboard with recent discoveries

### Extension Files
- `manifest.json` - Extension configuration
- `background.js` - Service worker for background tasks
- `content.js` - Content script for page interaction
- `popup.html/js` - Extension popup interface
- `injected.js` - Script injected into subscription pages

## 🔒 Security Features

- **Rate Limiting**: API route protection with Upstash Redis
- **Security Headers**: CSP, HSTS, XSS protection
- **Authentication**: Clerk-based user authentication
- **Authorization**: Route protection and user isolation
- **Input Validation**: Zod schema validation for all inputs

## 📱 Responsive Design

- Mobile-first responsive design
- Progressive Web App (PWA) ready
- Optimized for all device sizes
- Touch-friendly interface

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Other Platforms
- **Netlify**: Compatible with Next.js static export
- **Railway**: Full-stack deployment support
- **AWS**: Docker container deployment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Project Wiki](link-to-wiki)
- **Issues**: [GitHub Issues](link-to-issues)
- **Discussions**: [GitHub Discussions](link-to-discussions)

## 🔮 Roadmap

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Advanced analytics and reporting
- [ ] Team collaboration features
- [ ] Mobile app (React Native)
- [ ] AI-powered subscription insights
- [ ] Integration marketplace
- [ ] White-label solutions

---

Built with ❤️ using Next.js, React, and modern web technologies.

