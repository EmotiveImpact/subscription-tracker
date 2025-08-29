'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useUser } from '@/contexts/user-context'
import { Bell, Mail, Shield, CreditCard, Calendar, Smartphone, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const { settings, updateSettings, isLoading } = useUser()
  const [activeTab, setActiveTab] = useState('notifications')

  if (isLoading || !settings) {
    return (
      <div className="container mx-auto py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8" />
          <div className="space-y-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  const handleNotificationChange = (key: keyof typeof settings.notifications, value: boolean) => {
    updateSettings({
      notifications: {
        ...settings.notifications,
        [key]: value,
      },
    })
  }

  const handleIntegrationChange = (key: keyof typeof settings.integrations, value: boolean, email?: string) => {
    updateSettings({
      integrations: {
        ...settings.integrations,
        [key]: { connected: value, email: email || '' },
      },
    })
  }

  const handlePrivacyChange = (key: keyof typeof settings.privacy, value: string) => {
    updateSettings({
      privacy: {
        ...settings.privacy,
        [key]: value,
      },
    })
  }

  const handleCancellationChange = (key: keyof typeof settings.cancellation, value: any) => {
    updateSettings({
      cancellation: {
        ...settings.cancellation,
        [key]: value,
      },
    })
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account preferences and integrations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="privacy" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>
                Choose how and when you want to be notified about your subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">What to notify about</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Billing reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get notified before subscriptions renew
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.billing}
                      onCheckedChange={(checked) => handleNotificationChange('billing', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Trial expiration</Label>
                      <p className="text-sm text-muted-foreground">
                        Alerts when free trials are about to end
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.trial}
                      onCheckedChange={(checked) => handleNotificationChange('trial', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Price changes</Label>
                      <p className="text-sm text-muted-foreground">
                        Notify when subscription prices change
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.priceChanges}
                      onCheckedChange={(checked) => handleNotificationChange('priceChanges', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Cancellation reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Reminders to cancel unwanted subscriptions
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.cancellation}
                      onCheckedChange={(checked) => handleNotificationChange('cancellation', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">How to notify</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Email notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications via email
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => handleNotificationChange('email', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Push notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Browser push notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => handleNotificationChange('push', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>SMS notifications</Label>
                      <p className="text-sm text-muted-foreground">
                        Text message notifications
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.sms}
                      onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email & Calendar Integrations</CardTitle>
              <CardDescription>
                Connect your email and calendar to automatically detect subscriptions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">Gmail Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        Scan emails for subscription receipts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={settings.integrations.gmail.connected ? 'default' : 'secondary'}>
                      {settings.integrations.gmail.connected ? 'Connected' : 'Not Connected'}
                    </Badge>
                    <Button
                      variant={settings.integrations.gmail.connected ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleIntegrationChange('gmail', !settings.integrations.gmail.connected)}
                    >
                      {settings.integrations.gmail.connected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <div>
                      <h3 className="font-medium">Outlook Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        Scan Outlook emails for subscription receipts
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={settings.integrations.outlook.connected ? 'default' : 'secondary'}>
                      {settings.integrations.outlook.connected ? 'Connected' : 'Not Connected'}
                    </Badge>
                    <Button
                      variant={settings.integrations.outlook.connected ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleIntegrationChange('outlook', !settings.integrations.outlook.connected)}
                    >
                      {settings.integrations.outlook.connected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Calendar className="h-5 w-5 text-green-600" />
                    <div>
                      <h3 className="font-medium">Google Calendar</h3>
                      <p className="text-sm text-muted-foreground">
                        Sync subscription renewal dates
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant={settings.integrations.calendar.connected ? 'default' : 'secondary'}>
                      {settings.integrations.calendar.connected ? 'Connected' : 'Not Connected'}
                    </Badge>
                    <Button
                      variant={settings.integrations.calendar.connected ? 'outline' : 'default'}
                      size="sm"
                      onClick={() => handleIntegrationChange('calendar', !settings.integrations.calendar.connected)}
                    >
                      {settings.integrations.calendar.connected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Privacy & Data</CardTitle>
              <CardDescription>
                Control how your data is stored and used
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Data retention period</Label>
                  <Select
                    value={settings.privacy.dataRetention}
                    onValueChange={(value) => handlePrivacyChange('dataRetention', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3_months">3 months</SelectItem>
                      <SelectItem value="6_months">6 months</SelectItem>
                      <SelectItem value="1_year">1 year</SelectItem>
                      <SelectItem value="forever">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-muted-foreground">
                    How long to keep your subscription data
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Analytics sharing</Label>
                    <p className="text-sm text-muted-foreground">
                      Share anonymous usage data to improve the service
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.analyticsSharing}
                    onCheckedChange={(checked) => handlePrivacyChange('analyticsSharing', checked.toString())}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Third-party sharing</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow sharing data with trusted partners
                    </p>
                  </div>
                  <Switch
                    checked={settings.privacy.thirdPartySharing}
                    onCheckedChange={(checked) => handlePrivacyChange('thirdPartySharing', checked.toString())}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab */}
        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-medium capitalize">{settings.plan} Plan</h3>
                  <p className="text-sm text-muted-foreground">
                    {settings.plan === 'free' 
                      ? 'Free tier - 1 subscription limit'
                      : 'Pro tier - Unlimited subscriptions'
                    }
                  </p>
                </div>
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Plan
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Cancellation Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Auto-reminders</Label>
                      <p className="text-sm text-muted-foreground">
                        Get reminders to cancel unwanted subscriptions
                      </p>
                    </div>
                    <Switch
                      checked={settings.cancellation.autoReminders}
                      onCheckedChange={(checked) => handleCancellationChange('autoReminders', checked)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Difficulty filter</Label>
                    <Select
                      value={settings.cancellation.difficultyFilter}
                      onValueChange={(value) => handleCancellationChange('difficultyFilter', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All difficulties</SelectItem>
                        <SelectItem value="easy">Easy only</SelectItem>
                        <SelectItem value="medium">Medium and below</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Show cancellation instructions based on difficulty
                    </p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Show instructions</Label>
                      <p className="text-sm text-muted-foreground">
                        Display cancellation instructions for each subscription
                      </p>
                    </div>
                    <Switch
                      checked={settings.cancellation.instructions}
                      onCheckedChange={(checked) => handleCancellationChange('instructions', checked)}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
