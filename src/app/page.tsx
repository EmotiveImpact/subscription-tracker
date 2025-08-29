"use client"

import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  TrendingUp, 
  CreditCard, 
  Bell, 
  Shield, 
  Zap, 
  Globe, 
  Smartphone, 
  BarChart3,
  Check,
  Star,
  ArrowRight,
  Play,
  Users,
  DollarSign,
  Calendar,
  Target
} from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { isSignedIn, isLoaded } = useAuth()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    if (isLoaded && isSignedIn && !isRedirecting) {
      setIsRedirecting(true)
      router.push('/dashboard')
    }
  }, [isLoaded, isSignedIn, router, isRedirecting])

  if (!isLoaded || isRedirecting) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (isSignedIn) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">SubTracker</span>
          </div>
          <div className="hidden md:flex items-center space-x-6">
            <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
            <Link href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">
              Testimonials
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link href="/sign-in">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 py-20">
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
            🚀 Now with AI-powered subscription detection
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
            Never Lose Track of
            <span className="text-primary block bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Your Subscriptions
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
            Automatically discover, track, and manage all your recurring payments. 
            Save money with smart insights and never miss a renewal again.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/sign-up">
              <Button size="lg" className="text-lg px-8 py-6 group">
                Start Free Trial
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="#demo">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                <Play className="mr-2 w-5 h-5" />
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">10,000+</div>
              <div className="text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">$2.5M+</div>
              <div className="text-muted-foreground">Money Saved</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary">95%</div>
              <div className="text-muted-foreground">Detection Rate</div>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Powerful Features</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to take control of your subscription spending
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>AI-Powered Discovery</CardTitle>
                <CardDescription>
                  Automatically detect subscriptions from emails, receipts, and browser activity with 95% accuracy
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Analytics</CardTitle>
                <CardDescription>
                  Get insights into your spending patterns, identify savings opportunities, and track ROI
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Bell className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Smart Notifications</CardTitle>
                <CardDescription>
                  Never miss a renewal, price change, or trial expiration with intelligent alerts
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Multi-Platform Sync</CardTitle>
                <CardDescription>
                  Access your data from anywhere with our web app, mobile app, and Chrome extension
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Enterprise Security</CardTitle>
                <CardDescription>
                  Bank-level encryption, SOC 2 compliance, and enterprise-grade security features
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Goal Setting</CardTitle>
                <CardDescription>
                  Set spending limits, track progress, and achieve your financial goals
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">See It In Action</h2>
          <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
            Watch how SubTracker automatically discovers and manages your subscriptions
          </p>
          
          <div className="bg-muted rounded-2xl p-8 max-w-4xl mx-auto">
            <div className="aspect-video bg-background rounded-lg flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play className="w-10 h-10 text-primary" />
                </div>
                <p className="text-muted-foreground">Demo video coming soon</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start free and upgrade when you need more features
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="relative">
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Free</CardTitle>
                <div className="text-4xl font-bold text-primary">$0</div>
                <CardDescription>Perfect for getting started</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Up to 10 subscriptions</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Basic analytics</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Email notifications</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Chrome extension</span>
                  </div>
                </div>
                <Link href="/sign-up" className="w-full">
                  <Button variant="outline" className="w-full">Get Started Free</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Pro Plan */}
            <Card className="relative border-primary shadow-lg">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge variant="default" className="px-4 py-2">Most Popular</Badge>
              </div>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">Pro</CardTitle>
                <div className="text-4xl font-bold text-primary">$9</div>
                <CardDescription>per month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Unlimited subscriptions</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Advanced analytics & insights</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>AI-powered discovery</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Priority support</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Export & backup</span>
                  </div>
                  <div className="flex items-center">
                    <Check className="w-5 h-5 text-green-500 mr-2" />
                    <span>Team collaboration</span>
                  </div>
                </div>
                <Link href="/sign-up" className="w-full">
                  <Button className="w-full">Start Pro Trial</Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Loved by Thousands</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See what our users are saying about SubTracker
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                &ldquo;SubTracker saved me over $200/month by helping me discover forgotten subscriptions. The AI detection is incredible!&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Sarah Chen</div>
                  <div className="text-sm text-muted-foreground">Product Manager</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                &ldquo;As a small business owner, tracking subscription costs is crucial. SubTracker gives me insights I never had before.&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <DollarSign className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Mike Rodriguez</div>
                  <div className="text-sm text-muted-foreground">Business Owner</div>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex text-yellow-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                &ldquo;The Chrome extension is a game-changer. It automatically detects subscriptions as I browse. So convenient!&rdquo;
              </p>
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center mr-3">
                  <Smartphone className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">Alex Thompson</div>
                  <div className="text-sm text-muted-foreground">Software Engineer</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Take Control?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Join thousands of users who have saved money and gained peace of mind with SubTracker
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/sign-up">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6">
                Start Free Trial
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">SubTracker</span>
              </div>
              <p className="text-muted-foreground">
                The smart way to track and manage your subscriptions.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="#features" className="hover:text-foreground transition-colors">Features</Link></li>
                <li><Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link></li>
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About</Link></li>
                <li><Link href="/blog" className="hover:text-foreground transition-colors">Blog</Link></li>
                <li><Link href="/contact" className="hover:text-foreground transition-colors">Contact</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li><Link href="/help" className="hover:text-foreground transition-colors">Help Center</Link></li>
                <li><Link href="/docs" className="hover:text-foreground transition-colors">Documentation</Link></li>
                <li><Link href="/status" className="hover:text-foreground transition-colors">Status</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 SubTracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
