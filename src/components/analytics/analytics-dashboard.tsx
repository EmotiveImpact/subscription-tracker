'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Target, 
  AlertTriangle,
  PieChart,
  BarChart3,
  LineChart,
  PiggyBank,
  Clock,
  CheckCircle
} from 'lucide-react'
import { AnalyticsService, SubscriptionInsights } from '@/lib/analytics'
import { Subscription, Discovery } from '@/types'

interface AnalyticsDashboardProps {
  subscriptions: Subscription[]
  discoveries: Discovery[]
}

export default function AnalyticsDashboard({ subscriptions, discoveries }: AnalyticsDashboardProps) {
  const [insights, setInsights] = useState<SubscriptionInsights | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (subscriptions.length > 0) {
      const analyticsInsights = AnalyticsService.generateInsights(subscriptions, discoveries)
      setInsights(analyticsInsights)
    }
  }, [subscriptions, discoveries])

  if (!insights) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-4 w-4 text-green-600" />
    if (change < 0) return <TrendingDown className="h-4 w-4 text-red-600" />
    return <CheckCircle className="h-4 w-4 text-gray-600" />
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'secondary'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">
            Insights and trends for your subscription spending
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 mr-2" />
          Last 12 Months
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spending">Spending</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
          <TabsTrigger value="renewals">Renewals</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{insights.totalSubscriptions}</div>
                <p className="text-xs text-muted-foreground">
                  {insights.activeSubscriptions} active
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Monthly Spending</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(insights.totalSpending.averagePerMonth)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(insights.totalSpending.projectedAnnual)} annually
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Savings Opportunities</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insights.savingsOpportunities.length}
                </div>
                <p className="text-xs text-muted-foreground">
                  Potential savings identified
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Next Renewal</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {insights.renewalSchedule[0]?.daysUntilRenewal || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  days until next renewal
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Category Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Spending by Category
              </CardTitle>
              <CardDescription>How your subscription spending is distributed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.categoryBreakdown.slice(0, 5).map((category) => (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-blue-500" />
                      <span className="font-medium">{category.category}</span>
                      <Badge variant="secondary">{category.count}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(category.totalSpending)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {category.percentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Trends */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Monthly Spending Trends
              </CardTitle>
              <CardDescription>Your subscription spending over the last 12 months</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.monthlyTrends.slice(-6).map((trend) => (
                  <div key={trend.month} className="flex items-center justify-between">
                    <span className="font-medium">
                      {new Date(trend.month).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">
                        {formatCurrency(trend.spending)}
                      </span>
                      <div className="flex items-center gap-1">
                        {getTrendIcon(trend.change)}
                        <span className={`text-sm ${
                          trend.change > 0 ? 'text-green-600' : 
                          trend.change < 0 ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {trend.change > 0 ? '+' : ''}{trend.change}%
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spending" className="space-y-6">
          {/* Spending Pattern */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Spending Pattern Analysis
              </CardTitle>
              <CardDescription>Breakdown of your subscription costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Monthly Subscriptions</span>
                    <span className="font-bold">{formatCurrency(insights.totalSpending.monthly)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(insights.totalSpending.monthly / insights.totalSpending.total) * 100}%` 
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Annual Subscriptions</span>
                    <span className="font-bold">{formatCurrency(insights.totalSpending.yearly)}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ 
                        width: `${(insights.totalSpending.yearly / insights.totalSpending.total) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(insights.totalSpending.averagePerMonth)}
                    </div>
                    <div className="text-sm text-muted-foreground">Average per month</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(insights.totalSpending.projectedAnnual)}
                    </div>
                    <div className="text-sm text-muted-foreground">Projected annual</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatCurrency(insights.totalSpending.total)}
                    </div>
                    <div className="text-sm text-muted-foreground">Total monthly cost</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="savings" className="space-y-6">
          {/* Savings Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PiggyBank className="h-5 w-5" />
                Savings Opportunities
              </CardTitle>
              <CardDescription>Potential ways to reduce your subscription costs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {insights.savingsOpportunities.length > 0 ? (
                  insights.savingsOpportunities.map((opportunity, index) => (
                    <div key={index} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium">{opportunity.description}</span>
                          <Badge variant={getPriorityColor(opportunity.priority) as any}>
                            {opportunity.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {opportunity.action}
                        </p>
                        <div className="text-lg font-bold text-green-600">
                          Potential savings: {formatCurrency(opportunity.potentialSavings)}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        Take Action
                      </Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Great job!</h3>
                    <p className="text-muted-foreground">
                      No significant savings opportunities found. You&apos;re managing your subscriptions well!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="renewals" className="space-y-6">
          {/* Renewal Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Renewals
              </CardTitle>
              <CardDescription>Track when your subscriptions will renew</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights.renewalSchedule.slice(0, 10).map((renewal) => (
                  <div key={renewal.subscriptionId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        renewal.daysUntilRenewal <= 7 ? 'bg-red-500' :
                        renewal.daysUntilRenewal <= 30 ? 'bg-yellow-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <div className="font-medium">{renewal.merchantName}</div>
                        <div className="text-sm text-muted-foreground">
                          {renewal.renewalDate.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{formatCurrency(renewal.amount)}</div>
                      <div className="text-sm text-muted-foreground">
                        {renewal.daysUntilRenewal} days
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
