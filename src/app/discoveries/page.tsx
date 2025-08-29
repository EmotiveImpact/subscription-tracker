"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LoadingScreen } from '@/components/ui/loading'
import { useToast } from '@/hooks/use-toast'
import { Discovery } from '@/types'
import { 
  Mail, 
  Receipt, 
  CheckCircle, 
  XCircle, 
  PlusCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react'

export default function DiscoveriesPage() {
  const [discoveries, setDiscoveries] = useState<Discovery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchDiscoveries()
  }, [])

  const fetchDiscoveries = async () => {
    try {
      const response = await fetch('/api/discoveries')
      if (!response.ok) {
        throw new Error('Failed to fetch discoveries')
      }
      const data = await response.json()
      setDiscoveries(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch discoveries')
    } finally {
      setLoading(false)
    }
  }

  const handleDiscoveryAction = async (discoveryId: string, action: 'confirm' | 'ignore' | 'convert') => {
    try {
      const response = await fetch(`/api/discoveries/${discoveryId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (!response.ok) {
        throw new Error('Failed to process action')
      }

      const result = await response.json()
      
      // Update local state
      setDiscoveries(prev => 
        prev.map(d => 
          d.id === discoveryId 
            ? { ...d, status: result.status as Discovery['status'] }
            : d
        )
      )

      toast({
        title: "Success",
        description: result.message,
        variant: "success",
      })
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to process action",
        variant: "destructive",
      })
    }
  }

  const getSourceIcon = (source: Discovery['source']) => {
    switch (source) {
      case 'gmail':
      case 'outlook':
        return <Mail className="h-4 w-4" />
      case 'receipt_scan':
        return <Receipt className="h-4 w-4" />
      default:
        return <PlusCircle className="h-4 w-4" />
    }
  }

  const getConfidenceColor = (confidence: Discovery['confidence']) => {
    switch (confidence) {
      case 'high':
        return 'bg-green-100 text-green-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: Discovery['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800'
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'ignored':
        return 'bg-gray-100 text-gray-800'
      case 'converted':
        return 'bg-purple-100 text-purple-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <LoadingScreen />
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Discoveries</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchDiscoveries}>Try Again</Button>
        </div>
      </div>
    )
  }

  const pendingDiscoveries = discoveries.filter(d => d.status === 'pending')
  const otherDiscoveries = discoveries.filter(d => d.status !== 'pending')

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-2">
        <TrendingUp className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Subscription Discoveries</h1>
      </div>

      {/* Pending Discoveries */}
      {pendingDiscoveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Discoveries</CardTitle>
            <CardDescription>
              Review and confirm potential subscriptions found in your emails
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingDiscoveries.map((discovery) => (
              <div
                key={discovery.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    {getSourceIcon(discovery.source)}
                  </div>
                  <div>
                    <h3 className="font-medium">{discovery.merchantName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {discovery.amount} {discovery.currency}
                      {discovery.cycle && ` • ${discovery.cycle}`}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getConfidenceColor(discovery.confidence)}>
                        {discovery.confidence} confidence
                      </Badge>
                      <Badge variant="outline">
                        {discovery.source}
                      </Badge>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={() => handleDiscoveryAction(discovery.id, 'confirm')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDiscoveryAction(discovery.id, 'convert')}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Convert
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDiscoveryAction(discovery.id, 'ignore')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Ignore
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Other Discoveries */}
      {otherDiscoveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Processed Discoveries</CardTitle>
            <CardDescription>
              Discoveries you&apos;ve already reviewed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {otherDiscoveries.map((discovery) => (
              <div
                key={discovery.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                    {getSourceIcon(discovery.source)}
                  </div>
                  <div>
                    <h3 className="font-medium">{discovery.merchantName}</h3>
                    <p className="text-sm text-muted-foreground">
                      {discovery.amount} {discovery.currency}
                      {discovery.cycle && ` • ${discovery.cycle}`}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getStatusColor(discovery.status)}>
                        {discovery.status}
                      </Badge>
                      <Badge variant="outline">
                        {discovery.source}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {discoveries.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No Discoveries Yet</h3>
            <p className="text-muted-foreground mb-4">
              Connect your email accounts to automatically discover subscriptions
            </p>
            <Button onClick={() => window.location.href = '/settings'}>
              Connect Email Accounts
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
